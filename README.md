# Carried

**The line a book left in you.**

Not a review. Not a rating. You pick a book, write the one sentence you'd underline, stamp it with your name, and get a printed catalog card worth passing on. No account, no app. The link itself carries your line.

**[carried](https://github.com/ihmorol/carried)** · Next.js 16 · React 19 · Tailwind v4 · zero external services

---

## How it works

```
/#shelf ──▶  /b/[book]  ──▶  /l/[line]
 pick a      write inline,    your card
 book (or    sign, stamp      stamped & shareable
 add one)            ▲                │
                     └── every share  ▼  "what did it leave
                         is an invite    in you?", the loop
```

- **Shared when connected.** With Redis, public lines and counts refresh while the tab is visible. Without it, original editorial examples and URL-carried lines work without an account.
- **Portable links.** Live lines use meaningful short IDs; offline lines carry validated payloads. Existing short and legacy base64 links remain supported.
- **Readers add the books when the live shelf is connected.** Missing books receive a generated book-cloth spine. Offline book creation is disabled to avoid instance-only book links.
- **Find ways to read.** Book access links resolve asynchronously through Open Library/Internet Archive, Bookshop.org, and WorldCat. The writing workspace does not wait on optional metadata.
- **Original reflections to explore.** 1,430 editorial seed lines across 143 books, including 33 Bengali titles. This corpus is not automatic merchandise rights clearance.
- **Lines rise by merit.** Readers **underline** the lines that hit. One toggle per anonymous device id (no accounts), stored as unique-voter sets. Book margins sort by underline count, so the shelf is curated by readers, not by recency.
- **Two storage modes.** With Upstash Redis (free tier, 2 env vars) the shelf is global and shared. Without it, the app still works in offline mode: the link itself carries the line (base64url JSON payload), seeds fill the pages, and your lines live on your device.
- **Rich link previews.** `/l/[id]/opengraph-image` renders the exact catalog card with satori, so X, WhatsApp, and iMessage show the card, not a bare URL.
- **Save the card.** The same design is re-drawn client-side on a 1080×1350 canvas: a PNG with your name in the print.

## The virality playbook

This product was shaped by four well-documented findings about why things spread:

**1. People share to define themselves (68%)**
The New York Times Customer Insight Group's *Psychology of Sharing* found 68% of people share to give others a better sense of who they are. So the card is a **self-portrait**: your name stamped in print, *Carried by Amara*. The sharer looks well-read instead of like they're marketing us. ([study](https://foundationinc.co/wp-content/uploads/2018/12/NYT-Psychology-Of-Sharing.pdf))

**2. Social currency beats utility (STEPPS)**
Jonah Berger's *Contagious* framework maps directly: **Social currency** (a designed artifact that makes you look smart), **Emotion** (literary awe and recognition, which are high-arousal), **Public** (book pages collect every line openly), **Triggers** (any book anyone finished is a trigger to write), **Stories** (every card is a 20-word story), **Practical value** (a bookmark worth keeping). ([summary](https://jonahberger.com/virals-secret-formula))

**3. The Wordle mechanic: every share is an invitation**
Wordle grew from 90 players to millions because its share grid was self-contained, instantly legible, and contained a call to play. Carried's card is the same shape: quote + book + name, no context needed, and its footer lands the viewer on the book page where the first question is *"what did it leave in you?"* ([why it worked](https://www.buzzfeednews.com/article/stefficao/how-wordle-went-viral-strategy))

**4. Showcase the user, not the brand (Spotify Wrapped)**
Wrapped spreads because it's a personality snapshot, not an ad; the brand recedes. Our wordmark is a small ledger line at the top of the card; the reader's name is the loudest element on it. ([analysis](https://nogood.io/blog/spotify-wrapped-marketing-strategy))

Also designed in: zero-friction onboarding (one name field, remembered locally), a recognizable repeatable format (three inks, one layout, the Wordle grid property), and an accession number stamped on every card so the artifact feels filed, owned, real.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest: payload codec, search, store validation
npm run build      # production build
```

### The live shelf (production)

Without any setup the site runs in **offline mode** (URL-carried lines, seed feeds, local shelf). To make lines and books shared and realtime, connect Upstash Redis. Free tier, two env vars, no SDK:

1. Create a database at [upstash.com](https://upstash.com) (REST API enabled by default).
2. Set the two variables it shows you:

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

That's it. The API routes (`/api/books`, `/api/books/[slug]/lines`, `/api/recent`) switch to Redis, rate limits kick in (8 lines/hour and 4 books/hour per IP), and every feed goes live. The codec and card components don't change; only the source of truth does.

### Deploy

Push to GitHub → import in [Vercel](https://vercel.com/new) → set the env vars above plus `NEXT_PUBLIC_SITE_URL=https://your-domain.com` (used for canonical share URLs). No database to provision, no API keys beyond the two above. All 143 curated book pages, composer surfaces, and book OG images are prerendered at build; `/l/[id]` and the API render on demand.

## Project structure

```
src/
├── app/
│   ├── page.tsx                     # reading room, featured card, paged shelf
│   ├── b/[slug]/page.tsx            # book spine, inline composer, live lines
│   ├── l/[id]/page.tsx              # the card page, where every share lands
│   ├── l/[id]/opengraph-image.tsx   # satori card (X/WhatsApp preview)
│   ├── b/[slug]/opengraph-image.tsx # book OG (spine + invitation)
│   ├── api/
│   │   ├── books/route.ts           # GET all books · POST add a book
│   │   ├── books/[slug]/lines/      # GET + POST everyone's lines for a book
│   │   └── recent/route.ts          # GET freshest lines across the shelf
│   ├── shelf/page.tsx               # "my lines", local and private
│   └── sitemap.ts / robots.ts       # SEO plumbing
├── components/                      # LineCard, BookSpine, BookCover, BookLinks,
│                                    # StampMark, Composer, LinesFeed, RecentFeed,
│                                    # ShelfExplorer, ShareRow…
└── lib/
    ├── books.ts                     # 143-book dataset + instant search
    ├── store.ts                     # Store interface: RedisStore (Upstash REST) +
    │                                #   MemoryStore (offline dev) + rate limiting
    ├── line.ts                      # payload codec + lineSlugId (short link ids)
    ├── bookmeta.ts                  # free-archive resolver: Open Library →
    │                                #   Internet Archive → drawn spine fallback
    ├── inks.ts                      # the three card inks (paper/midnight/moss)
    ├── canvas.ts                    # 1080×1350 PNG export
    ├── seeds/                       # 1,430 editorial seed lines, ten per book
    └── use-poll.ts                  # visibility-aware polling hook
public/fonts/                        # Fraunces + IBM Plex Mono TTFs (canvas + satori)
```

## Merchandise concepts

Digital cards, Paper/Midnight/Moss styles, PNG downloads, and sharing stay free. `/shop` previews five proposed physical formats with actual Carried artwork. `/shop/[slug]` personalizes a concept; `/shop/cart` keeps device-local selections. Ordering is not open: no prices, payment, delivery details, or fake order-success flow.

See [the theme migration](docs/theme-migration.md), [design system](DESIGN.md), and [commerce boundary ADR](docs/adr/0002-free-digital-local-merchandise.md) for what changed and what is still required to launch physical sales.

## Design language

Library catalog card: warm paper (`#f2ecdd`), ink (`#211d17`), stamp vermilion (`#b23c25`), double-rule borders, Fraunces for the line and IBM Plex Mono for the ledger. The full guide lives in [docs/brand-guidelines.md](docs/brand-guidelines.md). Domain model in [CONTEXT.md](CONTEXT.md).

## Notes & limits

- Seeded lines are **editorial** reader-voice reflections. Quotation-like passages, translations, and art need separate commercial-rights review before merchandise launch.
- `/l/[id]` payloads are validated (version, slug, lengths, ink, calendar date) and bounded. The page resolves curated or carried book metadata first, then safely consults the live shelf for legacy records. All rendering uses React/satori escaping.
- Reader-added books get a slug from their title (collision-safe), a generated spine color, and a `reader-added` tag you can filter the shelf by.
- The card codec validates structure only; `findBook` decides existence, so the shelf can grow forever without invalidating old links.

## Credits

Type: [Fraunces](https://fonts.google.com/specimen/Fraunces) (Undercase Type) & [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) (IBM/Bold Monday), both OFL.
