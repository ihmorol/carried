import { describe, expect, it } from "vitest";
import { encodeLine, decodeLine, encodePayload, lineSlugId, LineError } from "@/lib/line";
import { searchBooks } from "@/lib/books";

const base = { bookSlug: "the-alchemist", text: "A line", name: "Reader", ink: "paper" as const, date: "2026-11-09" };

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
