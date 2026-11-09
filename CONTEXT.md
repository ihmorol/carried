# Context

Carried is a no-account quote-card site with optional public sharing storage and a device-local merchandise concept cart. This is the domain model.

## Entities

**Book** (`lib/books.ts`), static, curated: `slug, title, author, year, tags, spine`.
143 entries, including 33 Bengali books, prerendered at build (`/b/[slug]`). Books are *drawn* as spines
(`BookSpine` + `SPINE_COLORS`). Book-access links resolve asynchronously
(`lib/bookmeta.ts`: Open Library search → Internet Archive item; plus free archive links, Open Library work page, Internet Archive,
Bookshop, WorldCat, no API keys). Readers can add books (see Store); those
live in Redis, resolve at request time via `findBook`, and carry the
`reader-added` tag.

**Line** (`lib/line.ts`), the core entity. A reader's takeaway: `b` (book slug),
`q` (≤220 chars), `n` (≤24 chars), `s` (ink), `d` (ISO date), `v` (schema version, 1),
plus optional `bt/ba/by` (book title/author/year) carried **only** for reader-added
books, so their cards render with zero server state (see
`docs/adr/0001-line-payload-carries-reader-added-book.md`). The codec
(`encodeLine` / `decodeLine` / `encodePayload`) validates **structure only**,
whether the book exists is decided by the caller: the curated shelf via
`getBook`, then the payload's own meta via `bookForPayload`, then the live
shelf via `findBook`, so the shelf can grow without invalidating old links.
Consequences:

- `decodeLine` is the door to `/l/[id]`; structural failure → 404. The page then
  resolves the book (live shelf → payload meta) and 404s only when neither knows it.
- `lineSlugId` mints short, meaningful ids, first significant words of the
  line + a 5-char payload hash (`sheep-follow-chooses-k3f2`). Deterministic:
  identical payloads always share one URL; `resolveLine` resolves legacy
  base64 ids, store-stored slug ids, then seed slugs. When the store isn't
  live (`live: false` in the POST response), the composer skips store ids
  and carries the whole payload in the URL instead.

**Store** (`lib/store.ts`), the live, shared shelf behind `lib/Store`:

- `RedisStore`, Upstash Redis REST (2 env vars: `UPSTASH_REDIS_REST_URL/TOKEN`).
  Lists per book (`carried:lines:{slug}`, capped 500), a global recent feed
  (`carried:recent`, capped 200), reader-added books (hash `carried:books:user`),
  per-IP rate limits (8 lines/h, 4 books/h).
- `MemoryStore`, per-instance, preseeded with seeds; dev/zero-config fallback.
  Choose by env var presence (`getStore()`); the site is fully functional offline
  (URL-carried lines + local shelf) and goes global when Redis is connected.

**LineRecord**, `{ id, payload, t, votes? }`: a payload with its URL id,
timestamp, and (in API responses) underline count, the currency of every
feed. Feeds poll the API every 6–8 s while the tab is visible (`usePoll`).

**Votes** ("underlines"), one toggle per anonymous device id
(`lib/voter.ts`, localStorage UUID) stored as unique-voter sets
(`carried:votes:{id}` in Redis; Map in MemoryStore). `POST /api/lines/[id]/vote`
toggles; `getVoteCounts` batch-reads. Book-page margins sort by count desc,
newest-first on ties. Trade-off accepted: a determined user can rotate device
ids, the IP rate limit (240/h) is the second layer, not a hard guarantee.

**Ink** (`lib/inks.ts`), one of three card color schemes: `paper | midnight | moss`.
The single source of truth for the DOM card (`LineCard`), the canvas export
(`lib/canvas.ts`) and the satori OG renderers. Add a fourth nowhere without
changing all three surfaces + `isInkId`.

**Seed lines** (`lib/seeds/`), editorial corpus: **ten original reader-voice
lines per book** (1,430 total, across English and Bengali data files),
written in-house as reflections. The corpus is not commercial merchandise clearance;
quotation-like passages, translations, and art need rights review before printing for sale.
Fixed fields keep
ids stable; a coverage test (`npm test`) enforces 10 per book. They populate
book pages, the home ticker (capped rotation), and the daily front-page pick.

**Shelf** (`lib/shelf.ts`), the visitor's own lines, localStorage only
(`carried.shelf.v1`, name in `carried.name.v1`). No server ever sees it.

## Rendering surfaces of a Line (must stay visually identical)

1. `LineCard` (DOM), page display and grids
2. `lib/canvas.ts` (1080×1350 PNG), "Save the card"
3. `l/[id]/opengraph-image.tsx` (satori, 1200×630), link previews

All share compact content-led typography and script decisions. Web text uses local
WOFF2 fonts; matching static TTFs supply canvas/OG and are kept in the deploy
bundle via `outputFileTracingIncludes` in `next.config.ts`.

## The viral loop

Every shared card page ends in: "What did ⟨book⟩ leave in *you*?" → composer →
new card → new share. Nothing may interrupt that loop (no signup, no cookie
wall, no interstitial).

## Invariants

- No accounts or private server-side customer data. The optional public shelf stores submitted lines/names and anonymous votes; the personal shelf, language choice, and merchandise selections stay device-local. No orders, addresses, payments, or tracking are added.
- All user text rendered through React/satori (auto-escaped); lengths capped server-side too (`validateLineInput`, `validateBookInput`).
- Manrope and Anek Bangla are the two active house faces, with normal letter spacing. The current user-approved palette uses neutral/near-white surfaces and one coral accent family; the former letterpress fonts and wide tracking are superseded.
- Encoded line IDs are bounded at 4096 characters to accommodate maximum valid UTF-8 content. New offline public lines use payload IDs; seed and existing short IDs remain valid.
- Merchandise concepts: `/shop`, `/shop/[slug]`, `/shop/cart`; validated `carried.cart.v1` selections only, no checkout. All digital styles/downloads/sharing remain free. See `docs/adr/0002-free-digital-local-merchandise.md`.
- ADRs for significant decisions live in `docs/adr/`.
