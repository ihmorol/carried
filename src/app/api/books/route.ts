import { NextResponse } from "next/server";
import { getStore, StoreError, checkRate, allBooks, validateBookInput } from "@/lib/store";
import { readJsonObject } from "@/lib/api-input";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ books: await allBooks(), live: getStore().kind === "redis" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The live shelf is unreachable. Try again.", live: false }, { status: 502 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJsonObject(req);
    const input = validateBookInput(body as unknown as Parameters<typeof validateBookInput>[0]);
    if (getStore().kind !== "redis") throw new StoreError("Adding books needs the live shelf. You can still write and share cards for the curated books.", 503);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    await checkRate("book", ip, 4);
    const book = await getStore().addBook(input);
    return NextResponse.json({ book, live: true }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "The shelf hiccuped. Try again." }, { status: 500 });
  }
}
