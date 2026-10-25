import { describe, expect, it } from "vitest";
import { encodeLine, decodeLine, encodePayload, lineSlugId, accessionNo, LineError } from "@/lib/line";
import { searchBooks, getBook, BOOKS, normalize } from "@/lib/books";
import { slugifyTitle, validateLineInput, validateBookInput, StoreError, MemoryStore, isValidVoterId } from "@/lib/store";
import { SEED_LINES, SEED_LINE_BY_ID } from "@/lib/seeds";

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
    const { id } = encodeLine({ ...base, name: "Zoë", text: "Brontë was right, ça change tout." });
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
    expect(slugifyTitle("  ,.?!")).toBe("");
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

describe("line slug ids", () => {
  const payload = {
    v: 1 as const,
    b: "the-alchemist",
    q: "Sheep follow. The boy chooses. That's the whole test.",
    n: "Reader",
    s: "paper" as const,
    d: "2026-10-25",
  };

  it("is short, readable, and derived from the line", () => {
    const id = lineSlugId(payload);
    expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)+-[a-z0-9]{5}$/);
    expect(id.length).toBeLessThan(40);
    expect(id.startsWith("sheep")).toBe(true);
  });

  it("is deterministic per payload and distinct across payloads", () => {
    expect(lineSlugId(payload)).toBe(lineSlugId(payload));
    const other = { ...payload, n: "Someone Else", s: "moss" as const };
    expect(lineSlugId(other)).not.toBe(lineSlugId(payload));
    const otherLine = { ...payload, q: "Different words entirely, truly." };
    expect(lineSlugId(otherLine)).not.toBe(lineSlugId(payload));
  });

  it("drops stopwords and falls back to the book slug for non-latin lines", () => {
    expect(lineSlugId({ ...payload, q: "The it and the of" }).startsWith("the-alchemist-")).toBe(true);
    expect(lineSlugId({ ...payload, q: "To be, or not to be, that is the question" }).startsWith("question")).toBe(true);
    // a Bangla line keeps its link meaningful via the book slug
    const bnLine = { ...payload, q: "বইটা আমাকে যা শিখিয়েছে" };
    const id = lineSlugId(bnLine);
    expect(id.startsWith("the-alchemist-")).toBe(true);
    expect(id.length).toBeLessThan(40);
  });

  it("every seed has a unique short id resolvable without storage", () => {
    const ids = [...SEED_LINE_BY_ID.keys()];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.length).toBeLessThan(40);
  });

  it("covers every book with at least ten seed lines", () => {
    const counts = new Map<string, number>();
    for (const l of SEED_LINES) counts.set(l.b, (counts.get(l.b) ?? 0) + 1);
    for (const book of BOOKS) {
      const n = counts.get(book.slug) ?? 0;
      expect(`[${book.slug}] has ${n} seed lines`).toBe(`[${book.slug}] has 10 seed lines`);
    }
    expect(SEED_LINES.length).toBeGreaterThanOrEqual(BOOKS.length * 10);
  });

  it("seed slugs, dates and inks are all valid", () => {
    for (const l of SEED_LINES) {
      expect(getBook(l.b)).toBeDefined();
      expect(l.q.length).toBeGreaterThan(0);
      expect(l.q.length).toBeLessThanOrEqual(220);
      expect(l.n.length).toBeGreaterThan(0);
      expect(l.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const dt = new Date(`${l.d}T12:00:00Z`);
      expect(dt.toISOString().slice(0, 10)).toBe(l.d);
    }
  });
});

describe("memory store", () => {
  it("assigns short slug ids and resolves them", async () => {
    const store = new MemoryStore();
    const rec = await store.addLine("the-alchemist", {
      q: "Sheep follow. The boy chooses.",
      n: "Test",
      s: "paper",
    });
    expect(rec.id.length).toBeLessThan(40);
    const resolved = await store.getLineById(rec.id);
    expect(resolved?.n).toBe("Test");
    expect(resolved?.b).toBe("the-alchemist");
  });

  it("is idempotent for identical lines", async () => {
    const store = new MemoryStore();
    const a = await store.addLine("the-alchemist", { q: "Same words.", n: "Test", s: "moss" });
    const b = await store.addLine("the-alchemist", { q: "Same words.", n: "Test", s: "moss" });
    expect(a.id).toBe(b.id);
    const lines = await store.getLines("the-alchemist");
    expect(lines.filter((l) => l.id === a.id)).toHaveLength(1);
  });

  it("resolves seed lines by slug id", async () => {
    const store = new MemoryStore();
    const [seedId] = [...SEED_LINE_BY_ID.keys()];
    const resolved = await store.getLineById(seedId);
    expect(resolved).toBeDefined();
    expect(resolved?.n.length).toBeGreaterThan(0);
  });

  it("toggles underlines, one vote per voter, counted per line", async () => {
    const store = new MemoryStore();
    const rec = await store.addLine("the-alchemist", { q: "Vote on me.", n: "T", s: "paper" });

    const first = await store.toggleVote(rec.id, "voter-aaa");
    expect(first).toEqual({ votes: 1, voted: true });

    // same voter again → toggle off, not a second vote
    const off = await store.toggleVote(rec.id, "voter-aaa");
    expect(off).toEqual({ votes: 0, voted: false });
    const back = await store.toggleVote(rec.id, "voter-aaa");
    expect(back.votes).toBe(1);

    // second voter stacks
    const second = await store.toggleVote(rec.id, "voter-bbb");
    expect(second.votes).toBe(2);

    // seeds are votable too
    const [seedId] = [...SEED_LINE_BY_ID.keys()];
    await store.toggleVote(seedId, "voter-ccc");
    expect((await store.getVoteCounts([seedId, rec.id])).get(seedId)).toBe(1);
  });

  it("batch-counts underlines", async () => {
    const store = new MemoryStore();
    const a = await store.addLine("the-alchemist", { q: "A.", n: "T", s: "paper" });
    const b = await store.addLine("the-alchemist", { q: "B.", n: "T", s: "moss" });
    await store.toggleVote(a.id, "v1");
    await store.toggleVote(a.id, "v2");
    await store.toggleVote(a.id, "v3");
    await store.toggleVote(b.id, "v1");
    const counts = await store.getVoteCounts([a.id, b.id, "unknown-id"]);
    expect(counts.get(a.id)).toBe(3);
    expect(counts.get(b.id)).toBe(1);
    expect(counts.get("unknown-id")).toBe(0);
  });

  it("validates voter ids", () => {
    expect(isValidVoterId("abcd1234-ef56-7890-abcd-ef1234567890")).toBe(true);
    expect(isValidVoterId("short")).toBe(false);
    expect(isValidVoterId("has spaces here!")).toBe(false);
    expect(isValidVoterId("")).toBe(false);
  });
});
