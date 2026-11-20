import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCoverCache, COVER_OVERRIDES, exportCoverUrl, resolveCovers, SLUG_SHAPE } from "../book-covers";
import { BOOKS } from "../books";
import { GET } from "@/app/api/covers/route";

const bookmeta = vi.hoisted(() => ({ fetchBookMeta: vi.fn() }));
vi.mock("../bookmeta", () => bookmeta);

const OL_HIT = (coverId: number) => `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`;

/** Open Library search response echoing the queried title/author (a real match). */
function olEcho(url: string | URL | Request): Response {
  const params = new URL(String(url instanceof Request ? url.url : url)).searchParams;
  return {
    ok: true,
    json: async () => ({ docs: [{ title: params.get("title"), author_name: [params.get("author")], cover_i: 777 }] }),
  } as unknown as Response;
}

const fetchMock = () => vi.fn();

beforeEach(() => {
  clearCoverCache();
  bookmeta.fetchBookMeta.mockReset();
  vi.stubGlobal("fetch", fetchMock());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("cover overrides", () => {
  it("maps the four hand-verified editions to local files", () => {
    expect(Object.keys(COVER_OVERRIDES).sort()).toEqual(["1984", "dune", "the-alchemist", "the-little-prince"]);
    for (const entry of Object.values(COVER_OVERRIDES)) {
      expect(entry.source).toBe("verified");
      expect(entry.src.startsWith("/covers/")).toBe(true);
    }
    expect(exportCoverUrl("1984")).toBe("/covers/1984.jpg");
    expect(exportCoverUrl("the-hobbit")).toBeNull();
  });

  it("answers override slugs without touching the network", async () => {
    const covers = await resolveCovers(["1984", "dune"]);
    expect(covers).toEqual({ "1984": "/covers/1984.jpg", dune: "/covers/dune.jpg" });
    expect(fetch).not.toHaveBeenCalled();
    expect(bookmeta.fetchBookMeta).not.toHaveBeenCalled();
  });
});

describe("resolveCovers", () => {
  it("resolves a verified Open Library match", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => olEcho(url));
    const covers = await resolveCovers(["the-metamorphosis"]);
    expect(covers).toEqual({ "the-metamorphosis": OL_HIT(777) });
  });

  it("falls back to the shared bookmeta resolver when Open Library cannot answer", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("open library unreachable"));
    bookmeta.fetchBookMeta.mockResolvedValue({ coverUrl: "https://archive.org/services/img/kite-runner", workUrl: null });
    const covers = await resolveCovers(["the-kite-runner"]);
    expect(covers).toEqual({ "the-kite-runner": "https://archive.org/services/img/kite-runner" });
    expect(bookmeta.fetchBookMeta).toHaveBeenCalledWith(expect.objectContaining({ slug: "the-kite-runner" }));
  });

  it("rejects a source answer whose work identity does not match the shelf book", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [{ title: "Cooking for Two", author_name: ["Someone Else"], cover_i: 555 }] }),
    } as unknown as Response);
    const covers = await resolveCovers(["the-metamorphosis"]);
    expect(covers).toEqual({ "the-metamorphosis": null });
    // a rejected work must not sneak back in through the fallback
    expect(bookmeta.fetchBookMeta).not.toHaveBeenCalled();
  });

  it("rejects a bookmeta result that carries a mismatched identity", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("down"));
    bookmeta.fetchBookMeta.mockResolvedValue({ coverUrl: OL_HIT(555), title: "Frankenstein", author: "Mary Shelley" });
    const covers = await resolveCovers(["dracula"]);
    expect(covers).toEqual({ dracula: null });
  });

  it("caches a miss for the miss TTL and a hit for the hit TTL", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // miss: Open Library answers with a different work
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [{ title: "Not This Book", author_name: ["Nobody"], cover_i: 1 }] }),
    } as unknown as Response);
    await resolveCovers(["animal-farm"]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    await resolveCovers(["animal-farm"]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1); // cached miss, one hour

    vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);
    await resolveCovers(["animal-farm"]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2); // miss expired

    // hit: the search echoes the queried identity
    vi.mocked(fetch).mockImplementation(async (url) => olEcho(url));
    await resolveCovers(["siddhartha"]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
    await resolveCovers(["siddhartha"]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3); // cached hit, one week

    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);
    await resolveCovers(["siddhartha"]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(4); // hit expired
  });

  it("leaves non-curated and malformed slugs at null without any lookup", async () => {
    const covers = await resolveCovers(["not-a-shelf-book", "1984", "../escape", "", "constructor"]);
    expect(covers).toEqual({
      "not-a-shelf-book": null,
      "1984": "/covers/1984.jpg",
      "../escape": null,
      constructor: null,
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(bookmeta.fetchBookMeta).not.toHaveBeenCalled();
  });

  it("dedupes slugs", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => olEcho(url));
    const covers = await resolveCovers(["siddhartha", "siddhartha", " siddhartha "]);
    expect(Object.keys(covers)).toHaveLength(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("caps network lookups at 24 and resolves the rest as null", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => olEcho(url));
    const slugs = BOOKS.filter((b) => !COVER_OVERRIDES[b.slug]).slice(0, 30).map((b) => b.slug);
    const covers = await resolveCovers(slugs);
    expect(Object.keys(covers)).toHaveLength(30);
    expect(Object.values(covers).filter((url) => url !== null)).toHaveLength(24);
    expect(Object.values(covers).filter((url) => url === null)).toHaveLength(6);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(24);
    expect(bookmeta.fetchBookMeta).not.toHaveBeenCalled();
  });

  it("resolves pending lookups as null at the deadline and does not cache the loss", async () => {
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>(() => {}));
    const hung = await resolveCovers(["norwegian-wood", "circe"], { deadlineMs: 80 });
    expect(hung).toEqual({ "norwegian-wood": null, circe: null });

    vi.mocked(fetch).mockImplementation(async (url) => olEcho(url));
    const recovered = await resolveCovers(["norwegian-wood", "circe"]);
    expect(recovered).toEqual({ "norwegian-wood": OL_HIT(777), circe: OL_HIT(777) });
  });

  it("never throws, whatever the sources do", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("down"));
    bookmeta.fetchBookMeta.mockRejectedValue(new Error("down"));
    const covers = await resolveCovers(["macbeth", "1984"]);
    expect(covers).toEqual({ macbeth: null, "1984": "/covers/1984.jpg" });
  });

  it("keeps at most 4 lookups in flight", async () => {
    let active = 0;
    let maxActive = 0;
    vi.mocked(fetch).mockImplementation(async (url) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return olEcho(url);
    });
    const slugs = BOOKS.filter((b) => !COVER_OVERRIDES[b.slug]).slice(0, 24).map((b) => b.slug);
    await resolveCovers(slugs);
    expect(maxActive).toBeLessThanOrEqual(4);
    expect(maxActive).toBe(4);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(24);
  });
});

describe("GET /api/covers", () => {
  const url = (query: string) => new Request(`http://localhost:3000/api/covers${query}`);

  it("resolves curated slugs with verified overrides, no-store", async () => {
    const res = await GET(url("?slugs=1984,dune,not-a-shelf-book"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ covers: { "1984": "/covers/1984.jpg", dune: "/covers/dune.jpg", "not-a-shelf-book": null } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects missing, malformed, and oversized slug lists", async () => {
    expect((await GET(url(""))).status).toBe(400);
    expect((await GET(url("?slugs="))).status).toBe(400);
    expect((await GET(url("?slugs=Big%20Slug"))).status).toBe(400);
    expect((await GET(url("?slugs=1984,../etc"))).status).toBe(400);
    expect((await GET(url(`?slugs=${Array.from({ length: 65 }, (_, i) => `book-${i}`).join(",")}`))).status).toBe(400);
  });

  it("dedupes repeated slugs in one response", async () => {
    const res = await GET(url("?slugs=dune,dune"));
    const data = (await res.json()) as { covers: Record<string, string | null> };
    expect(Object.keys(data.covers)).toEqual(["dune"]);
  });
});

describe("slug shape", () => {
  it("accepts shelf-shaped slugs and rejects path or query fragments", () => {
    expect(SLUG_SHAPE.test("1984")).toBe(true);
    expect(SLUG_SHAPE.test("the-little-prince")).toBe(true);
    expect(SLUG_SHAPE.test("../escape")).toBe(false);
    expect(SLUG_SHAPE.test("a?b")).toBe(false);
    expect(SLUG_SHAPE.test("-lead")).toBe(false);
    expect(SLUG_SHAPE.test(`${"a".repeat(81)}`)).toBe(false);
  });
});
