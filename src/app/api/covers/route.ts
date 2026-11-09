import { NextResponse } from "next/server";
import { SLUG_SHAPE, resolveCovers } from "@/lib/book-covers";

export const dynamic = "force-dynamic";

const MAX_REQUESTED_SLUGS = 64;

/**
 * GET /api/covers?slugs=1984,dune
 * Front-cover URLs for curated shelf slugs. Unknown slugs resolve null
 * (the tile draws its authored cover); malformed input is rejected.
 */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("slugs");
  if (raw === null || !raw.trim()) {
    return NextResponse.json({ error: "List the slugs you want covers for, e.g. ?slugs=1984,dune." }, { status: 400 });
  }
  const slugs = raw.split(",").map((slug) => slug.trim()).filter(Boolean);
  if (slugs.length > MAX_REQUESTED_SLUGS) {
    return NextResponse.json({ error: `Ask for at most ${MAX_REQUESTED_SLUGS} slugs at a time.` }, { status: 400 });
  }
  const malformed = slugs.find((slug) => !SLUG_SHAPE.test(slug));
  if (malformed !== undefined) {
    return NextResponse.json({ error: `"${malformed.slice(0, 80)}" is not a shelf slug.` }, { status: 400 });
  }
  // resolveCovers dedupes and caps the lookups at MAX_RESOLVED_COVERS itself;
  // anything beyond the cap still appears, resolved null.
  const covers = await resolveCovers(slugs);
  return NextResponse.json({ covers }, { headers: { "cache-control": "no-store" } });
}
