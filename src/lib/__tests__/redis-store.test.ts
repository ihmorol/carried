import { afterEach, describe, expect, it, vi } from "vitest";
import { getStore, checkRate } from "@/lib/store";
import { encodePayload, lineSlugId, type LinePayload } from "@/lib/line";

/**
 * RedisStore is the production shelf behind the API routes. These tests drive
 * its REST command protocol through the public store API only: metadata that
 * rides on stored payloads, slug-id collision handling, per-IP rate limiting,
 * duplicate-book slugs, and corrupt-record recovery.
 */

const globalStore = globalThis as typeof globalThis & { __carriedStore?: unknown };
afterEach(() => { delete globalStore.__carriedStore; vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function makeRedis() {
  const strings = new Map<string, string>();
  const lists = new Map<string, string[]>();
  const hashes = new Map<string, Map<string, string>>();
  const counters = new Map<string, number>();
  const calls: string[] = [];
  function exec(parts: (string | number)[]): unknown {
    const [cmd, ...args] = parts.map(String);
    calls.push([cmd, ...args].join(" "));
    switch (cmd) {
      case "GET": return strings.get(args[0]) ?? null;
      case "SET": { if (args[2] === "NX") { if (strings.has(args[0])) return null; strings.set(args[0], args[1]); return "OK"; } strings.set(args[0], args[1]); return "OK"; }
      case "LRANGE": return lists.get(args[0])?.slice(Number(args[1]), Number(args[2]) + 1) ?? [];
      case "LPUSH": { const list = lists.get(args[0]) ?? []; list.unshift(args[1]); lists.set(args[0], list); return list.length; }
      case "LTRIM": return "OK";
      case "LLEN": return lists.get(args[0])?.length ?? 0;
      case "HGET": return hashes.get(args[0])?.get(args[1]) ?? null;
      case "HSET": { const h = hashes.get(args[0]) ?? new Map<string, string>(); h.set(args[1], args[2]); hashes.set(args[0], h); return 1; }
      case "INCR": { const n = (counters.get(args[0]) ?? 0) + 1; counters.set(args[0], n); return n; }
      case "EXPIRE": return 1;
      case "SCARD": return 0;
      default: return null;
    }
  }
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/pipeline")) {
      const cmds = JSON.parse(String(init?.body)) as string[][];
      return new Response(JSON.stringify(cmds.map((command) => ({ result: exec(command) }))));
    }
    const parts = url.replace(/^https?:\/\/[^/]+\//, "").split("/").map((part) => decodeURIComponent(part));
    return new Response(JSON.stringify({ result: exec(parts) }));
  });
  return { fetcher, calls, strings, lists, counters };
}

function connect() {
  const redis = makeRedis();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock");
  vi.stubGlobal("fetch", redis.fetcher);
  return redis;
}

const payload: LinePayload = { v: 1, b: "the-alchemist", q: "The treasure was the shelf.", n: "Mira", s: "paper", d: "2026-11-21" };

describe("live shelf (Upstash REST)", () => {
  it("carries reader-added book metadata and the edition on every stored line, then dedupes without a second write", async () => {
    const redis = connect();
    const store = getStore();
    const book = await store.addBook({ title: "My Reader Book", author: "R. Author", year: 2024 });
    expect(book.slug).toBe("my-reader-book");
    const record = await store.addLine(book.slug, { q: "Carried in the link.", n: "Mira", s: "moss", ct: "ticket-v1" });
    const stored = JSON.parse(redis.strings.get(`carried:line:${record.id}`)!) as LinePayload;
    expect(stored).toMatchObject({ q: "Carried in the link.", bt: "My Reader Book", ba: "R. Author", by: 2024, ct: "ticket-v1" });
    // The NX claim SET and the pipeline SET are the two writes of a fresh line;
    // a replay must add neither again.
    const writes = redis.calls.filter((call) => call.startsWith("SET carried:line:")).length;
    expect(writes).toBe(2);
    const replay = await store.addLine(book.slug, { q: "Carried in the link.", n: "Mira", s: "moss", ct: "ticket-v1" });
    expect(replay.id).toBe(record.id);
    expect(redis.calls.filter((call) => call.startsWith("SET carried:line:")).length).toBe(writes);
  });

  it("extends the short-id suffix when a different line claims the same slug id", async () => {
    const redis = connect();
    const store = getStore();
    const id5 = lineSlugId(payload, 5);
    redis.strings.set(`carried:line:${id5}`, encodePayload({ ...payload, q: "A different line entirely." }));
    const record = await store.addLine(payload.b, { q: payload.q, n: payload.n, s: payload.s });
    const id6 = lineSlugId(payload, 6);
    expect(record.id).toBe(id6);
    expect(JSON.parse(redis.strings.get(`carried:line:${id6}`)!)).toEqual(payload);
    expect(record.payload).toEqual(payload);
  });

  it("reclaims an identical payload's id without duplicating the feed", async () => {
    const redis = connect();
    const id5 = lineSlugId(payload, 5);
    // The id-key stores the JSON payload, exactly as RedisStore writes it.
    redis.strings.set(`carried:line:${id5}`, JSON.stringify(payload));
    const record = await getStore().addLine(payload.b, { q: payload.q, n: payload.n, s: payload.s });
    expect(record.id).toBe(id5);
    expect(record.payload).toEqual(payload);
    expect(redis.lists.get("carried:recent") ?? []).toHaveLength(0);
  });

  it("expires a fresh rate-limit key and refuses the ninth line in an hour", async () => {
    const redis = connect();
    await expect(checkRate("line", "1.2.3.4", 8)).resolves.toBeUndefined();
    expect(redis.calls.some((call) => call.startsWith("INCR carried:rl:line:1.2.3.4"))).toBe(true);
    expect(redis.calls.some((call) => call.startsWith("EXPIRE carried:rl:line:1.2.3.4 3600 NX"))).toBe(true);
    // The NX expire rides on every hit, so a counter whose TTL was lost to a
    // crashed round trip is healed on the next request instead of 429ing forever.
    redis.counters.set("carried:rl:line:8.8.8.8", 3);
    await expect(checkRate("line", "8.8.8.8", 8)).resolves.toBeUndefined();
    expect(redis.calls.some((call) => call.startsWith("EXPIRE carried:rl:line:8.8.8.8 3600 NX"))).toBe(true);
    redis.counters.set("carried:rl:line:9.9.9.9", 8);
    await expect(checkRate("line", "9.9.9.9", 8)).rejects.toMatchObject({ status: 429 });
  });

  it("disambiguates duplicate reader books and refuses when every derived slug is taken", async () => {
    const store = connect() && getStore();
    const first = await store.addBook({ title: "My Reader Book", author: "R. Author", year: 2024 });
    const second = await store.addBook({ title: "My Reader Book", author: "R. Author", year: 2024 });
    expect(second.slug).not.toBe(first.slug);
    expect(second.slug.startsWith(first.slug)).toBe(true);
    await expect(store.addBook({ title: "My Reader Book", author: "R. Author", year: 2024 })).rejects.toMatchObject({ status: 409 });
  });

  it("drops corrupt stored records instead of crashing the feed", async () => {
    const redis = connect();
    const valid = { id: "good-line", payload, t: 1 };
    redis.lists.set("carried:lines:the-alchemist", [
      "{truncated",
      JSON.stringify(valid),
      JSON.stringify({ id: "bad-ink", payload: { ...payload, s: "neon-v9" }, t: 2 }),
    ]);
    const records = await getStore().getLines("the-alchemist");
    expect(records).toEqual([valid]);
  });
});
