import { NextResponse } from "next/server";
import {
  getStore,
  StoreError,
  checkRate,
  findBook,
} from "@/lib/store";
import type { InkId } from "@/lib/inks";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/** Everyone's lines for one book — the client polls this for the live feed. */
export async function GET(req: Request, { params }: Params) {
  const { slug } = await params;
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 200);
  try {
    const store = getStore();
    const [lines, total] = await Promise.all([
      store.getLines(slug, limit),
      store.countLines(slug),
    ]);
    return NextResponse.json(
      { lines, total, live: store.kind === "redis" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "The live shelf is unreachable." },
      { status: 502 },
    );
  }
}

/** Carry a line out of this book. No account; name travels with the line. */
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const book = await findBook(slug);
    if (!book) {
      return NextResponse.json({ error: "That book is not on the shelf." }, { status: 404 });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    await checkRate("line", ip, 8);
    const body = (await req.json()) as { q?: string; n?: string; s?: InkId };
    const record = await getStore().addLine(slug, {
      q: String(body.q ?? ""),
      n: String(body.n ?? ""),
      s: (body.s ?? "paper") as InkId,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "The shelf hiccuped. Try again." }, { status: 500 });
  }
}
