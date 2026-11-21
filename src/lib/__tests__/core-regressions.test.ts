import { describe, expect, it } from "vitest";
import { encodeLine, decodeLine, encodePayload, validateLinePayload, lineSlugId, LineError } from "@/lib/line";
import { searchBooks } from "@/lib/books";
import { inspectDraftInput } from "@/lib/draft-input";

const base = { bookSlug: "the-alchemist", text: "A line", name: "Reader", ink: "paper" as const, date: "2026-11-09" };

describe("draft projection", () => {
  it("keeps normalization separate from safe display projection without truncation", () => {
    const draft = inspectDraftInput("  A\n  line  ", "  Mira    Noor  ");
    expect(draft).toEqual({ q: "A line", n: "Mira Noor", lineLength: 6, nameLength: 9, lineIssue: null, nameIssue: null, proofLine: "A line", proofName: "Mira Noor" });
  });
  it("never projects over-limit or empty content into a card renderer", () => {
    const long = "ব".repeat(221);
    expect(inspectDraftInput(long, "ন".repeat(25))).toMatchObject({ q: long, lineLength: 221, lineIssue: "too-long", nameIssue: "too-long", proofLine: null, proofName: null });
    expect(inspectDraftInput(" \n ", " \t ")).toMatchObject({ q: "", n: "", lineIssue: "empty", nameIssue: "empty", proofLine: null, proofName: null });
  });
  it("counts UTF-16 code units exactly like encodeLine, not graphemes or bytes", () => {
    expect(inspectDraftInput("😀".repeat(110), "ন".repeat(24))).toMatchObject({ lineLength: 220, nameLength: 24, lineIssue: null, nameIssue: null });
    expect(inspectDraftInput("😀".repeat(111), "Reader")).toMatchObject({ lineLength: 222, lineIssue: "too-long", proofLine: null });
    expect(inspectDraftInput("  " + "ব".repeat(220) + " \n", "Reader")).toMatchObject({ lineLength: 220, lineIssue: null });
  });
});

describe("accepted line boundaries", () => {
  it("round trips maximum Bengali content and book metadata", () => {
    const { id, payload } = encodeLine({ ...base, bookSlug: "reader-book", text: "ব".repeat(220), name: "ন".repeat(24), book: { title: "ট".repeat(90), author: "ল".repeat(60), year: 2024 } });
    expect(decodeLine(id)).toEqual(payload);
  });
  it("throws a domain error for JSON null and invalid calendar dates", () => {
    expect(() => decodeLine(encodePayload(null as never))).toThrow(LineError);
    expect(() => encodeLine({ ...base, date: "2026-02-30" })).toThrow(LineError);
  });
  it("validates runtime ink before returning a payload", () => {
    expect(() => encodeLine({ ...base, ink: "gold" as never })).toThrow(LineError);
  });
  it("bounds non-Latin fallback short ids", () => {
    const { payload } = encodeLine({ ...base, bookSlug: "long-reader-book-".repeat(6), text: "বই", book: { title: "A reader book", author: "Reader", year: 2024 } });
    expect(lineSlugId(payload).length).toBeLessThanOrEqual(64);
  });
});

describe("discovery aliases", () => {
  it("finds Nineteen Eighty-Four by its conventional numerical title", () => {
    expect(searchBooks("1984")[0]?.slug).toBe("1984");
  });
});

describe("card editions", () => {
  it("keeps legacy payloads free of any edition field", () => {
    const { payload } = encodeLine(base);
    expect(JSON.stringify(payload)).toBe('{"v":1,"b":"the-alchemist","q":"A line","n":"Reader","s":"paper","d":"2026-11-09"}');
  });
  it("round trips an explicit edition after the book metadata", () => {
    const { id, payload } = encodeLine({ ...base, bookSlug: "reader-book", book: { title: "Carried Book", author: "Reader", year: 2024 }, template: "poster-v1" });
    expect(JSON.stringify(payload)).toBe('{"v":1,"b":"reader-book","q":"A line","n":"Reader","s":"paper","d":"2026-11-09","bt":"Carried Book","ba":"Reader","by":2024,"ct":"poster-v1"}');
    expect(decodeLine(id)).toEqual(payload);
  });
  it("rejects unknown editions at both boundaries", () => {
    expect(() => encodeLine({ ...base, template: "neon-v9" as never })).toThrow(LineError);
    expect(() => decodeLine(encodePayload({ ...decodeLine(encodeLine(base).id), ct: "neon-v9" as never }))).toThrow(LineError);
    expect(() => decodeLine(encodePayload({ ...decodeLine(encodeLine(base).id), ct: null as never }))).toThrow(LineError);
  });
  it("canonicalizes edition position, so permuted JSON validates identically", () => {
    const ordered = { v: 1 as const, b: "the-alchemist", q: "A line", n: "Reader", s: "paper" as const, d: "2026-11-09", ct: "ticket-v1" as const };
    const shuffled = { ct: "ticket-v1", d: "2026-11-09", s: "paper", n: "Reader", q: "A line", b: "the-alchemist", v: 1 };
    expect(validateLinePayload(ordered)).toEqual(validateLinePayload(shuffled));
    expect(encodePayload(validateLinePayload(shuffled))).toBe(encodePayload(ordered));
  });
});
