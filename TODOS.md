# TODOS

Follow-ups surfaced by the 0.2.0 pre-landing reviews. Grouped by area, then priority.

## Performance

**Priority:** P1
Feed polls replace every record object each tick, so whole card grids re-run text-fit layout every 6-8s. Reuse unchanged record objects in LinesFeed/ReaderLinesFeed/RecentFeed updaters and wrap LineCard in React.memo; consider memoizing layoutEditionArtwork per (text, edition). (specialist finding, evidence in PR #)

**Priority:** P1
Book-page feed defaults to 200 records per 6s poll with no 304 path (~40MB/h on an open page, metered mobile). Default the client to ~24 records with load-more, add ETag/If-None-Match or a votes-only delta tick. (specialist finding)

**Priority:** P2
PNG export loads ~1.8MB of TTF faces; the identical WOFF2 files (~0.6MB) work in FontFace and would cut the download for metered mobile. Keep TTFs for satori. Verify PNG pixel parity after the swap. (specialist finding)

**Priority:** P2
/l/[id] OG re-renders per crawler hit with all nine TTFs and no cache headers; /b/[slug] is prerendered. Add response caching and per-route font subsets (also shrinks outputFileTracingIncludes). (specialist finding)

**Priority:** P3
toggleVote uses three sequential round trips; SISMEMBER+SCARD can share a pipeline. l/[id] duplicates resolveLine/resolveBookForLine between generateMetadata and the page — wrap in React cache(). (specialist findings)

## Reliability

**Priority:** P2
Unify API error envelopes: GET /api/books returns `{ error, live: false }`, GET /api/books/[slug]/lines returns `{ error }` only, POSTs return bare `{ error }`. Standardize on `{ error, live: false }`. (specialist finding)

**Priority:** P2
Upstash error text no longer reaches clients (`store.ts` `cmd` returns the generic unreachable message; fixed by 226b5e1), but the upstream error is dropped silently instead of logged. Log it server-side so shelf outages stay diagnosable. (specialist finding)

**Priority:** P2
Vote sets never expire while the vote route accepts URL-minted payload ids, so key space grows unbounded. Decide: TTL on vote sets, or persist votes only for ids that exist in `carried:line:*`/seeds. Revisit the documented trade-off in CONTEXT.md when deciding. (specialist finding)

**Priority:** P3
Feed GETs are unthrottled and unbounded (SCARD pipelines per request, force-dynamic). Add short revalidation (feeds already poll client-side every 6-8s) and/or rate-limit GETs. (specialist finding)

**Priority:** P3
ShelfExplorer addBook treats only 503 as "shelf unreachable"; a 502 falls through to the generic error with live still true. Treat 502 the same as 503. (specialist finding)

**Priority:** P3
Rate limiting buckets on x-forwarded-for with an "anon" fallback. Verify the deploy host sets a trustworthy client IP; reject-or-bucket untrusted requests. (specialist finding, pre-existing)

## Tests

**Priority:** P3
ShareRow post-download print prompt success path (savedCard → /shop link) has no test; download failure is covered. (coverage audit gap P18)

**Priority:** P3
RedisStore short-id collision exhaustion (all ten suffix widths claimed → 409) and same-payload reclaim are untested; only single extension is covered. (specialist finding)

**Priority:** P3
LinePage 404 contract (garbage id, oversized id, unresolvable book) is untested end-to-end. (specialist finding)

## Completed

**Completed:** v0.2.0 (2026-11-21) — collectible card editions, reading room shop concept storefront, print pathway, card stamp restrike, rate-limiter self-heal, line-write pipeline, coverage 37 → ~280 tests.

**Completed:** v0.2.0.0 (2026-11-21) — README API section now documents GET /api/covers (slugs param, 64 cap, null-for-unknown), the 240/h vote rate limit, the `live` field on shelf responses, and the feed limit-param 400 behavior.
