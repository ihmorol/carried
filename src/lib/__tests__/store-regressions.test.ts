import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryStore, getStore, resolveBookForLine, validateBookInput, validateLineInput, StoreError } from "@/lib/store";
import { decodeLine, type LinePayload } from "@/lib/line";

const globalStore = globalThis as typeof globalThis & { __carriedStore?: unknown };
afterEach(() => { delete globalStore.__carriedStore; vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("store contracts", () => {
  it("keeps user feed links independent of MemoryStore instance", async () => {
    const store = new MemoryStore();
    const line = await store.addLine("the-alchemist", { q: "A portable feed line.", n: "Reader", s: "paper" });
    expect(decodeLine(line.id)).toEqual(line.payload);
  });
  it("rejects unknown books and malformed field types", async () => {
    await expect(new MemoryStore().addLine("missing", { q: "A line", n: "Reader", s: "paper" })).rejects.toBeInstanceOf(StoreError);
    expect(() => validateLineInput({ q: {} as never, n: "Reader", s: "paper" })).toThrow(StoreError);
    expect(() => validateBookInput({ title: "Book", author: "Reader", year: NaN })).toThrow(StoreError);
  });
  it("generates distinct stable slugs for unrelated native-script books", async () => {
    const store = new MemoryStore();
    const books = await Promise.all(["প্রথম", "দ্বিতীয়", "তৃতীয়"].map((title) => store.addBook({ title, author: "লেখক", year: 2024 })));
    expect(new Set(books.map((book) => book.slug)).size).toBe(3);
  });
  it("renders carried book data without contacting a failing live store", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock");
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetcher);
    const payload: LinePayload = { v: 1, b: "reader-book", q: "A line", n: "Reader", s: "paper", d: "2026-11-09", bt: "A reader book", ba: "Reader", by: 2024 };
    expect((await resolveBookForLine(payload))?.title).toBe("A reader book");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses Upstash nested command arrays and rejects command errors", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ result: 7 }])));
    vi.stubGlobal("fetch", fetcher);
    expect((await getStore().getVoteCounts(["line-one"])).get("line-one")).toBe(7);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual([["SCARD", "carried:votes:line-one"]]);
    fetcher.mockResolvedValue(new Response(JSON.stringify([{ error: "invalid command" }])));
    await expect(getStore().getVoteCounts(["line-one"])).rejects.toBeInstanceOf(StoreError);
  });
  it("treats the same words in different editions as distinct cards", async () => {
    const store = new MemoryStore();
    const legacy = await store.addLine("the-alchemist", { q: "Same words, new frame.", n: "Reader", s: "paper" });
    const ticket = await store.addLine("the-alchemist", { q: "Same words, new frame.", n: "Reader", s: "paper", ct: "ticket-v1" });
    expect(legacy.id).not.toBe(ticket.id);
    expect(ticket.payload.ct).toBe("ticket-v1");
    expect(legacy.payload.ct).toBeUndefined();
    await expect(store.addLine("the-alchemist", { q: "x", n: "Reader", s: "paper", ct: "neon-v9" as never })).rejects.toBeInstanceOf(StoreError);
    const replay = await store.addLine("the-alchemist", { q: "Same words, new frame.", n: "Reader", s: "paper", ct: "ticket-v1" });
    expect(replay.id).toBe(ticket.id);
  });
});
