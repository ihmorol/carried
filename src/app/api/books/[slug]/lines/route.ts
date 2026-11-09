import { NextResponse } from "next/server";
import { getStore, StoreError, checkRate, findBook, validateLineInput } from "@/lib/store";
import { readJsonObject, queryLimit } from "@/lib/api-input";
import { seedLinesFor } from "@/lib/seeds";
import type { InkId } from "@/lib/inks";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const limit = queryLimit(new URL(req.url).searchParams.get("limit"), 200, 200);
    const store = getStore();
    const [records, total] = await Promise.all([store.getLines(slug, limit), store.countLines(slug)]);
    const seeds = seedLinesFor(slug).map((payload) => ({ id: payload.id, payload, t: new Date(`${payload.d}T12:00:00Z`).getTime() }));
    const merged = [...new Map([...seeds, ...records].map((record) => [record.id, record])).values()].slice(0, limit);
    const counts = await store.getVoteCounts(merged.map((record) => record.id));
    const lines = merged.map((record) => ({ ...record, votes: counts.get(record.id) ?? 0 }));
    return NextResponse.json({ lines, total: store.kind === "memory" ? total : total + seeds.length, live: store.kind === "redis" }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof StoreError ? err.message : "The live shelf is unreachable." }, { status: err instanceof StoreError ? err.status : 502 });
  }
}

export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const body = await readJsonObject(req);
    const s = (body.s ?? "paper") as InkId;
    const input = validateLineInput({ q: body.q as string, n: body.n as string, s });
    if (!await findBook(slug)) throw new StoreError("That book is not on the shelf.", 404);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    await checkRate("line", ip, 8);
    const store = getStore();
    const record = await store.addLine(slug, { ...input, s });
    return NextResponse.json({ ...record, live: store.kind === "redis" }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "The shelf hiccuped. Try again." }, { status: 500 });
  }
}
