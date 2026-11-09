import { NextResponse } from "next/server";
import { getStore, StoreError } from "@/lib/store";
import { queryLimit } from "@/lib/api-input";

export const dynamic = "force-dynamic";

/** The freshest lines across the whole shelf, home page ticker. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  try {
    const limit = queryLimit(url.searchParams.get("limit"), 40, 100);
    const store = getStore();
    const lines = await store.getRecent(limit);
    const counts = await store
      .getVoteCounts(lines.map((l) => l.id))
      .catch(() => new Map<string, number>());
    const withVotes = lines.map((l) => ({ ...l, votes: counts.get(l.id) ?? 0 }));
    return NextResponse.json(
      { lines: withVotes, live: store.kind === "redis" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json({ lines: [], live: false, error: err instanceof StoreError ? err.message : "The live shelf is unreachable." }, { status: err instanceof StoreError ? err.status : 502 });
  }
}
