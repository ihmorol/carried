# Context

Carried is a no-account quote-card site with optional public sharing storage and a device-local merchandise concept cart. This is the domain model.

## Entities

**Book** (`lib/books.ts`), static, curated: `slug, title, author, year, tags, spine`.
143 entries, including 33 Bengali books, prerendered at build (`/b/[slug]`). Home and catalogue discovery use dense authored cloth spines (`BookSpine`); compact search and book-detail variants retain their own dimensions. The home carousel pairs a line with a closed 3D volume whose front is a resolved 2:3 cover (`FrontCover`), with labeled authored fallbacks in `SPINE_COLORS`. Cover planes and changing cloth-color fields are presentation, not new Book data. Book-access links resolve asynchronously
(`lib/bookmeta.ts`: Open Library search → Internet Archive item; plus free archive links, Open Library work page, Internet Archive,
Bookshop, WorldCat, no API keys). Readers can add books (see Store); those
live in Redis, resolve at request time via `findBook`, and carry the
`reader-added` tag.

**Line** (`lib/line.ts`), the core entity. A reader's takeaway: `b` (book slug),
`q` (≤220 chars), `n` (≤24 chars), `s` (ink), `d` (ISO date), `v` (schema version, 1),
plus optional `bt/ba/by` (book title/author/year) carried **only** for reader-added
books, and optional `ct` (card edition: `bookplate-v1 | poster-v1 | ticket-v1`,
validated against `lib/card-templates.ts`). Absent `ct` means the line predates
editions: its serialization and identity never change, and renderers present the
house edition as a display-only mapping without writing it back. Editions are
independent of ink; store dedupe and cart identity treat different editions as
distinct cards (see `docs/adr/0002-free-digital-local-merchandise.md` and the
payload ADR). The codec
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

**Ink** (`lib/inks.ts`), one of three immutable card color schemes: `paper | midnight | moss`.
The single source of truth for the DOM card (`LineCard`), the canvas export
(`lib/canvas.ts`) and the satori OG renderers. The reading-room theme changes
page tokens only; all original ink values stay intact. No fourth ink is part
of this redesign.

**Seed lines** (`lib/seeds/`), editorial corpus: **ten original reader-voice
lines per book** (1,430 total, across English and Bengali data files),
written in-house as reflections. The corpus is not commercial merchandise clearance;
quotation-like passages, translations, and art need rights review before printing for sale.
Fixed fields keep ids stable; a coverage test (`npm test`) enforces 10 per book.
They populate book pages, the home reader-line feed, and the paired carousel
whose first selection is the daily front-page pick.

**Shelf** (`lib/shelf.ts`), the visitor's own lines, localStorage only
(`carried.shelf.v1`, name in `carried.name.v1`). No server ever sees it.

## Rendering surfaces of a Line (must stay visually identical)

1. `LineCard` (DOM), page display and grids
2. `lib/canvas.ts` (1080×1350 PNG), "Save the card"
3. `l/[id]/opengraph-image.tsx` (satori, 1200×630), link previews

All surfaces use `card-presentation.ts` for shared content, including the measured
`author · publication year` byline. The payload's `ct` selects the edition;
missing `ct` still maps to Bookplate for display only. Bookplate is now an open
left-aligned header/quote/credit/footer without a certificate frame; Poster and
Ticket retain their identities with simpler furniture. `lib/text-layout.ts`
measures credit and ownership before allocating quote space, with explicit
maximum-content/dense clearances. DOM and PNG share portrait geometry; OG is
an explicit landscape adaptation. None of this changes inks, edition IDs,
payload serialization, or line identity.

Web text uses local WOFF2 fonts; matching static TTFs supply canvas/OG and are
kept in the deploy bundle via `outputFileTracingIncludes` in `next.config.ts`.

## Discovery presentation

The home pairs a book and its line in one active carousel, led by the daily
pick, then shows a full-width spine shelf (20 books initially) and reader lines.
`/books` uses the same shelf at 24 books initially, without a carousel. Header
search shares URL `q`/`genre` state with the shelf via `carried:search` and
`popstate`; it introduces no storage. Cloth planes and cover art are display-only.

Compact mobile discovery shows the full quote/name instead of miniature artwork.
A lazy Base UI modal drawer contains canonical card/share controls and real
`/l/[id]` and book-writing links; it is not a new Line entity or route identity.
Motion 14.12.0 and Base UI 1.9.0 are MIT-licensed UI dependencies.

## The viral loop

Every shared card page ends in: "What did ⟨book⟩ leave in *you*?" → composer →
new card → new share. Nothing may interrupt that loop (no signup, no cookie
wall, no interstitial).

## Invariants

- No accounts or private server-side customer data. The optional public shelf stores submitted lines/names and anonymous votes; the personal shelf, language choice, and merchandise selections stay device-local. No orders, addresses, payments, or tracking are added.
- All user text rendered through React/satori (auto-escaped); lengths capped server-side too (`validateLineInput`, `validateBookInput`).
- Noto Serif Bengali is the display/quote face across both scripts; Manrope and Anek Bangla remain the interface pair. All three are locally hosted at 400/500/600 with normal prose and Bengali letter spacing. The approved energetic nostalgic page theme uses butter-paper (`#f5edda`), raised paper (`#fff9ee`), petrol (`#173f3c`), persimmon (`#ff8755`), and pistachio (`#d0dcaf`). These page tokens never replace the original `INKS`; the former letterpress fonts and wide tracking remain superseded.
- The reading room retains one document scroll and a floating 72px rail inside a reserved 96px gutter (208px inside 232px when expanded), but replaces the whole-page split with paired discovery above a dense shelf. Keep mobile writing access before the catalogue. Carousel rotation waits 9 idle seconds and stops for hover, focus/manual selection, pause, reduced motion, an open drawer, or hidden/offscreen state. Manual navigation remains available; motion state is in memory only. Physical book planes are presentation, never catalogue or reader data, and content never waits on animation.
- Encoded line IDs are bounded at 4096 characters to accommodate maximum valid UTF-8 content. New offline public lines use payload IDs; seed and existing short IDs remain valid.
- Merchandise concepts: `/shop`, `/shop/[slug]`, `/shop/cart`; validated `carried.cart.v1` selections only, no checkout. All digital styles/downloads/sharing remain free. See `docs/adr/0002-free-digital-local-merchandise.md`.
- ADRs for significant decisions live in `docs/adr/`.
