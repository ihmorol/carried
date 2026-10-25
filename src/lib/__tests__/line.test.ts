import { describe, expect, it } from "vitest";
import { encodeLine, decodeLine, encodePayload, accessionNo, LineError } from "@/lib/line";
import { searchBooks, getBook, normalize } from "@/lib/books";
import { slugifyTitle, validateLineInput, validateBookInput, StoreError } from "@/lib/store";

describe("line codec", () => {
  const base = {
    bookSlug: "the-alchemist",
    text: "The treasure was never behind the dunes.",
    name: "Amara",
    ink: "paper" as const,
    date: "2026-01-12",
  };

  it("round-trips a payload through the id", () => {
    const { id, payload } = encodeLine(base);
    const decoded = decodeLine(id);
    expect(decoded).toEqual(payload);
    expect(decoded.q).toBe(base.text);
    expect(decoded.n).toBe(base.name);
    expect(decoded.b).toBe("the-alchemist");
  });

  it("is URL-safe and stable", () => {
    const { id } = encodeLine(base);
    expect(id).not.toMatch(/[+/=]/);
    expect(encodeLine(base).id).toBe(id);
  });

  it("handles unicode names and lines", () => {
    const { id } = encodeLine({ ...base, name: "Zoë", text: "Brontë was right — ça change tout." });
    const decoded = decodeLine(id);
    expect(decoded.n).toBe("Zoë");
    expect(decoded.q).toContain("ça change");
  });

  it("rejects empty text, empty name, oversized input, bad ink", () => {
    expect(() => encodeLine({ ...base, text: "   " })).toThrow(LineError);
    expect(() => encodeLine({ ...base, name: "" })).toThrow(LineError);
    expect(() => encodeLine({ ...base, text: "x".repeat(221) })).toThrow(LineError);
    expect(() => encodeLine({ ...base, name: "x".repeat(25) })).toThrow(LineError);
    expect(() =>
      decodeLine(
        encodeLine({ ...base }).id.slice(0, -4) + "AAAA",
      ),
    ).toThrow();
  });

  it("rejects garbage ids without throwing raw errors", () => {
    expect(() => decodeLine("!!!not-base64!!!")).toThrow(LineError);
    expect(() => decodeLine("eyJ2Ijo5O30")).toThrow(LineError); // {"v":9;}
  });

  it("mints stable accession numbers", () => {
    const { id } = encodeLine(base);
    expect(accessionNo(id)).toMatch(/^[0-9A-Z]{6}$/);
    expect(accessionNo(id)).toBe(accessionNo(id));
  });
});

describe("book search", () => {
  it("matches titles ignoring case and diacritics", () => {
    expect(normalize("Brontë")).toBe("bronte");
    const hits = searchBooks("bronte");
    expect(hits.some((b) => b.title === "Wuthering Heights")).toBe(true);
  });

  it("ranks title matches above author mentions", () => {
    const hits = searchBooks("hamlet");
    expect(hits[0]?.slug).toBe("hamlet");
  });

  it("finds by author surname", () => {
    const hits = searchBooks("murakami");
    expect(hits.length).toBeGreaterThanOrEqual(3);
  });

  it("finds by tag and returns nothing for junk", () => {
    expect(searchBooks("philosophy").length).toBeGreaterThan(3);
    expect(searchBooks("zzzqqq")).toEqual([]);
  });

  it("every slug resolves", () => {
    for (const b of searchBooks("fiction", 1000)) {
      expect(getBook(b.slug)).toBeDefined();
    }
  });
});

describe("store validation", () => {
  it("slugifies titles for reader-added books", () => {
    expect(slugifyTitle("The Wings of Fire!")).toBe("the-wings-of-fire");
    expect(slugifyTitle("Brontë & Sisters")).toBe("bronte-sisters");
    expect(slugifyTitle("   ——— ")).toBe("");
  });

  it("rejects bad lines and books with StoreError", () => {
    expect(() => validateLineInput({ q: "", n: "A", s: "paper" })).toThrow(StoreError);
    expect(() => validateLineInput({ q: "x".repeat(221), n: "A", s: "paper" })).toThrow(StoreError);
    expect(() => validateBookInput({ title: "", author: "A" })).toThrow(StoreError);
    expect(() => validateBookInput({ title: "T", author: "A", year: 99999 })).toThrow(StoreError);
    const ok = validateBookInput({ title: "  Trip  Echo ", author: "Zoe", year: 0 });
    expect(ok).toEqual({ title: "Trip Echo", author: "Zoe", year: new Date().getFullYear() });
  });

  it("encodePayload round-trips without the curated-book check", () => {
    const payload = {
      v: 1 as const,
      b: "reader-added-book",
      q: "A line from a book the readers shelved themselves.",
      n: "Sami",
      s: "moss" as const,
      d: "2026-10-25",
    };
    expect(decodeLine(encodePayload(payload))).toEqual(payload);
  });
});
