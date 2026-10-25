import { NextResponse } from "next/server";
import {
  getStore,
  StoreError,
  checkRate,
  resolveLine,
  isValidVoterId,
} from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Toggle the reader's "underline" on a line. Uniqueness comes from the
 * anonymous device id (one vote per id per line), with an IP rate limit
 * as the second layer.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    if (id.length > 512) {
      return NextResponse.json({ error: "Unknown line." }, { status: 404 });
    }
    const line = await resolveLine(id);
    if (!line) {
      return NextResponse.json({ error: "That line is not in the ledger." }, { status: 404 });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    await checkRate("vote", ip, 240);

    const body = (await req.json()) as { voterId?: string };
    const voterId = String(body.voterId ?? "");
    if (!isValidVoterId(voterId)) {
      return NextResponse.json({ error: "Unknown reader." }, { status: 400 });
    }

    const result = await getStore().toggleVote(id, voterId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "The shelf hiccuped. Try again." }, { status: 500 });
  }
}
