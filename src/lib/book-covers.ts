import { fetchBookMeta } from "./bookmeta";
import { getBook, normalize, type Book } from "./books";

/**
 * Front covers for the shelf.
 *
 * A cover is either a verified local file (edition checked by hand, recorded
 * in public/covers/SOURCES.md), or a free-archive scan resolved at request
 * time through the same sources as the book pages (`lib/bookmeta.ts`).
 * Archive lookups are verified: the work a source returns must match the
 * shelf book's own title and author, otherwise the cover is rejected and the
 * tile falls back to its authored cover. The resolver never throws; on any
 * failure (or the overall deadline) slugs resolve to null.
 */

export type CoverOverride = { src: string; source: "verified" };

/** Hand-verified edition covers served from public/covers/ (see SOURCES.md). */
export const COVER_OVERRIDES: Record<string, CoverOverride> = {
  "the-little-prince": { src: "/covers/the-little-prince.jpg", source: "verified" },
  "1984": { src: "/covers/1984.jpg", source: "verified" },
  "the-alchemist": { src: "/covers/the-alchemist.jpg", source: "verified" },
  dune: { src: "/covers/dune.jpg", source: "verified" },
};

/** The local cover for a hand-verified slug, or null when there is none. */
export function exportCoverUrl(slug: string): string | null {
  return COVER_OVERRIDES[slug]?.src ?? null;
}

/** Curated-shelf slugs only, lowercase letters/digits/hyphens. */
export const SLUG_SHAPE = /^[a-z0-9][a-z0-9-]{0,79}$/;

export const MAX_RESOLVED_COVERS = 24;
const HIT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // covers don't churn
const MISS_TTL_MS = 60 * 60 * 1000;
const OVERALL_DEADLINE_MS = 4000;
const MIN_LOOKUP_BUDGET_MS = 400;
const SEARCH_TIMEOUT_MS = 2500;
const MAX_CONCURRENCY = 4;

type CacheEntry = { url: string | null; at: number };
const cache = new Map<string, CacheEntry>();

function cachedUrl(slug: string): string | null | undefined {
  const entry = cache.get(slug);
  if (!entry) return undefined;
  const fresh = Date.now() - entry.at < (entry.url === null ? MISS_TTL_MS : HIT_TTL_MS);
  if (!fresh) {
    cache.delete(slug);
    return undefined;
  }
  return entry.url;
}

/** Punctuation-insensitive comparison: "J. R. R. Tolkien" matches "J.R.R. Tolkien". */
function comparable(s: string): string {
  return normalize(s).replace(/[^a-z0-9\u0980-\u09ff]/g, "");
}

function titleMatches(returned: string, book: Book): boolean {
  const a = comparable(returned);
  const b = comparable(book.title);
  return a.length > 0 && (a === b || a.startsWith(b) || b.startsWith(a));
}

function authorMatches(returned: string[], book: Book): boolean {
  const mine = comparable(book.author);
  if (!mine) return false;
  return returned.some((name) => {
    const theirs = comparable(name);
    return theirs === mine || theirs.startsWith(mine) || mine.startsWith(theirs);
  });
}

type VerifiedLookup =
  | { state: "hit"; url: string }
  | { state: "reject" } // answered with a different work: never serve it
  | { state: "defer" }; // could not answer confidently: let the wider resolver try

/**
 * Open Library search that returns the matched work's own identity, so the
 * cover can be checked against the shelf book before it is trusted.
 */
async function verifiedOpenLibraryCover(book: Book, budgetMs: number): Promise<VerifiedLookup> {
  const params = new URLSearchParams({
    title: book.title,
    author: book.author,
    fields: "title,author_name,cover_i",
    limit: "1",
  });
  let data: { docs?: Array<{ title?: unknown; author_name?: unknown; cover_i?: unknown }> };
  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { "user-agent": "carried-site/1.0 (cover resolver)" },
      signal: AbortSignal.timeout(Math.min(budgetMs, SEARCH_TIMEOUT_MS)),
      // one lookup per book per week; covers don't churn
      next: { revalidate: 604800 },
    });
    if (!res.ok) return { state: "defer" };
    data = (await res.json()) as typeof data;
  } catch {
    return { state: "defer" };
  }
  const doc = data.docs?.[0];
  if (!doc || typeof doc.cover_i !== "number") return { state: "defer" };
  const title = typeof doc.title === "string" ? doc.title : "";
  const authors = Array.isArray(doc.author_name) ? doc.author_name.filter((n): n is string => typeof n === "string") : [];
  if (!titleMatches(title, book) || !authorMatches(authors, book)) return { state: "reject" };
  // default=false → 404 instead of a blank placeholder when no scan exists
  return { state: "hit", url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false` };
}

/**
 * One book's cover: verified search first; when Open Library cannot answer,
 * the existing two-source resolver (whose queries bind title + author) still
 * gets a chance at the Internet Archive's scans. A meta result that reports
 * the matched work's identity is verified the same way; a mismatch is a miss.
 */
async function lookupCover(book: Book, budgetMs: number): Promise<string | null> {
  const verified = await verifiedOpenLibraryCover(book, budgetMs);
  if (verified.state === "hit") return verified.url;
  if (verified.state === "reject") return null;
  const remaining = budgetMs - SEARCH_TIMEOUT_MS;
  const meta = remaining > MIN_LOOKUP_BUDGET_MS ? await fetchBookMeta(book) : null;
  if (!meta) return null;
  const identity = meta as { title?: unknown; author?: unknown };
  if (typeof identity.title === "string" && typeof identity.author === "string") {
    if (!titleMatches(identity.title, book) || !authorMatches([identity.author], book)) return null;
  }
  return meta.coverUrl;
}

class DeadlineError extends Error {}

function deadlinePromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new DeadlineError()), Math.max(ms, 0));
    if (typeof timer === "object" && timer !== null && "unref" in timer) timer.unref();
  });
}

export type ResolveCoversOptions = { deadlineMs?: number };

/**
 * Resolve front-cover URLs for shelf slugs. Curated slugs only (reader-added
 * books resolve null), deduped, capped at 24 lookups. Cached: hits for a
 * week, misses for an hour. The whole batch finishes within the deadline;
 * whatever is still pending resolves null without poisoning the cache.
 * Never throws.
 */
export async function resolveCovers(
  slugs: readonly unknown[],
  options: ResolveCoversOptions = {},
): Promise<Record<string, string | null>> {
  const covers: Record<string, string | null> = {};
  try {
    const seen = new Set<string>();
    const valid: string[] = [];
    for (const raw of slugs) {
      const slug = typeof raw === "string" ? raw.trim() : "";
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      covers[slug] = null;
      if (SLUG_SHAPE.test(slug) && getBook(slug)) valid.push(slug);
    }
    const lookups = valid.slice(0, MAX_RESOLVED_COVERS).filter((slug) => {
      const override = COVER_OVERRIDES[slug];
      if (override) {
        covers[slug] = override.src;
        return false;
      }
      const url = cachedUrl(slug);
      if (url !== undefined) {
        covers[slug] = url;
        return false;
      }
      return true;
    });
    if (lookups.length === 0) return covers;

    const deadlineAt = Date.now() + Math.max(options.deadlineMs ?? OVERALL_DEADLINE_MS, 0);
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < lookups.length) {
        const slug = lookups[cursor++];
        const remaining = deadlineAt - Date.now();
        if (remaining <= MIN_LOOKUP_BUDGET_MS) continue; // out of time: stays null, uncached
        const book = getBook(slug)!;
        let url: string | null = null;
        let completed = false;
        try {
          url = await Promise.race([
            lookupCover(book, remaining).then((value) => { completed = true; return value; }),
            deadlinePromise(remaining),
          ]);
        } catch {
          completed = false; // deadline cut this lookup off
        }
        if (completed) {
          cache.set(slug, { url, at: Date.now() });
          covers[slug] = url;
        }
        // deadline losses stay null and uncached, so a slow moment can't
        // masquerade as a real miss
      }
    };
    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, lookups.length) }, worker));
  } catch {
    // resolveCovers never throws; whatever resolved so far is returned
  }
  return covers;
}

/** Test hook: drop every cached resolution. */
export function clearCoverCache(): void {
  cache.clear();
}
