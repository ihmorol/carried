import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** The freshest lines across the whole shelf — home page ticker. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40) || 40, 100);
  try {
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
  } catch {
    return NextResponse.json({ lines: [], live: false }, { status: 502 });
  }
}
