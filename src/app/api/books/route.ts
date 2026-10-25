import { NextResponse } from "next/server";
import { getStore, StoreError, checkRate, allBooks } from "@/lib/store";

export const dynamic = "force-dynamic";

/** All books, curated plus reader-added. */
export async function GET() {
  const store = getStore();
  const books = await allBooks();
  return NextResponse.json(
    { books, live: store.kind === "redis" },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Add a missing book. No account, one per IP per 15 min is plenty. */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    await checkRate("book", ip, 4);
    const body = (await req.json()) as { title?: string; author?: string; year?: number };
    const book = await getStore().addBook({
      title: String(body.title ?? ""),
      author: String(body.author ?? ""),
      year: body.year === undefined ? undefined : Number(body.year),
    });
    return NextResponse.json({ book }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "The shelf hiccuped. Try again." }, { status: 500 });
  }
}
