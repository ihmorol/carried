import { describe, expect, it } from "vitest";
import { POST as votePost } from "@/app/api/lines/[id]/vote/route";
import { POST as addBookPost } from "@/app/api/books/route";
import { POST as addLinePost, GET as bookLinesGet } from "@/app/api/books/[slug]/lines/route";
import { SEED_LINES } from "@/lib/seeds";

/**
 * Handler-level denial branches: the store helpers are unit-tested elsewhere;
 * here the routes must prove they map bad input to the right status codes.
 * Without env vars the store is the MemoryStore, which is exactly the mode
 * these guards run in.
 */

const json = (body: unknown) => new Request("http://carried.test/api", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const seedId = SEED_LINES[0].id;

describe("api route denial branches", () => {
  it("404s an unknown line before touching the vote body", async () => {
    const res = await votePost(new Request("http://carried.test/api"), { params: Promise.resolve({ id: "never-minted-line" }) });
    expect(res.status).toBe(404);
  });
  it("400s an unreadable voter id on a resolvable line", async () => {
    const res = await votePost(json({ voterId: "<script>" }), { params: Promise.resolve({ id: seedId }) });
    expect(res.status).toBe(400);
  });
  it("503s reader book creation on the offline store instead of pretending to save", async () => {
    const res = await addBookPost(json({ title: "My Reader Book", author: "R. Author", year: 2024 }));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toMatch(/live shelf/i);
  });
  it("404s a line stamp for a book that is not on the shelf", async () => {
    const res = await addLinePost(json({ q: "A line for nowhere.", n: "Mira" }), { params: Promise.resolve({ slug: "missing-book" }) });
    expect(res.status).toBe(404);
  });
  it("degrades an unknown book's feed to an empty page instead of an error", async () => {
    const res = await bookLinesGet(new Request("http://carried.test/api"), { params: Promise.resolve({ slug: "missing-book" }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { lines: unknown[]; total: number; live: boolean };
    expect(body).toMatchObject({ lines: [], total: 0, live: false });
  });
});
