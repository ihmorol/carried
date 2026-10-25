# Carried

**The line a book left in you.**

Not a review. Not a rating. You pick a book, write the one sentence you'd underline, stamp it with your name, and get a printed catalog card worth passing on. No account, no app — the link itself carries your line.

**[carried](https://github.com/ihmorol/carried)** · Next.js 16 · React 19 · Tailwind v4 · zero external services

---

## How it works

```
/#shelf ──▶  /b/[book]  ──▶  /l/[line]
 pick a      write inline,    your card
 book (or    sign, stamp      stamped & shareable
 add one)            ▲                │
                     └── every share  ▼  "what did it leave
                         is an invite    in you?" — the loop
```

- **Everything is live.** Lines land on the book page and the home ticker in real time (6–8 s polling, no reload). No accounts anywhere: your name rides with the line.
- **Short, meaningful links.** Every line gets a slug cut from its own words plus a hash suffix: `carried.site/l/sheep-follow-the-boy-chooses-k3f2`. Deterministic, so the same line always keeps the same URL; legacy base64 links keep resolving too.
- **Readers add the books.** Missing from the shelf? Two fields and it's there, with a generated book-cloth spine, ready for everyone's lines.
- **Real covers, free archives.** Book pages pull cover scans from Open Library, falling back to Internet Archive item scans, falling back to the designed spine — the book is never a broken image. A "Find the book" row links Open Library (read/borrow), Internet Archive (free copies & audio), Bookshop.org (buy), and WorldCat (libraries). No API keys anywhere.
- **A shelf that's never empty.** 1,100 editorial seed lines — ten per book, written in reader voice — so every book page has a live-feeling margin from day one. New reader lines flow in above them in real time.
- **Lines rise by merit.** Readers **underline** the lines that hit — one toggle per anonymous device id (no accounts), stored as unique-voter sets. Book margins sort by underline count, so the shelf is curated by readers, not by recency.
- **Two storage modes.** With Upstash Redis (free tier, 2 env vars) the shelf is global and shared. Without it, the app still works in offline mode: the link itself carries the line (base64url JSON payload), seeds fill the pages, and your lines live on your device.
- **Rich link previews.** `/l/[id]/opengraph-image` renders the exact catalog card with satori, so X, WhatsApp, and iMessage show the card, not a bare URL.
- **Save the card.** The same design is re-drawn on a 1080×1350 canvas client-side — a PNG with your name in the print.

## The virality playbook

This product was shaped by four well-documented findings about why things spread:

**1. People share to define themselves — 68%.**
The New York Times Customer Insight Group's *Psychology of Sharing* found 68% of people share to give others a better sense of who they are. So the card is a **self-portrait**: your name stamped in print, *Carried by Amara* — the sharer looks well-read, not like they're marketing us. ([study](https://foundationinc.co/wp-content/uploads/2018/12/NYT-Psychology-Of-Sharing.pdf))

**2. Social currency beats utility — STEPPS.**
Jonah Berger's *Contagious* framework maps directly: **Social currency** (a designed artifact that makes you look smart), **Emotion** (literary awe and recognition — high-arousal), **Public** (book pages collect every line openly), **Triggers** (any book anyone finished is a trigger to write), **Stories** (every card is a 20-word story), **Practical value** (a bookmark worth keeping). ([summary](https://jonahberger.com/virals-secret-formula))

**3. The Wordle mechanic — every share is an invitation.**
Wordle grew from 90 players to millions because its share grid was self-contained, instantly legible, and contained a call to play. Carried's card is the same shape: quote + book + name, no context needed, and its footer lands the viewer on the book page where the first question is *"what did it leave in you?"* ([why it worked](https://www.buzzfeednews.com/article/stefficao/how-wordle-went-viral-strategy))

**4. Showcase the user, not the brand — Spotify Wrapped.**
Wrapped spreads because it's a personality snapshot, not an ad; the brand recedes. Our wordmark is a small ledger line at the top of the card; the reader's name is the loudest element on it. ([analysis](https://nogood.io/blog/spotify-wrapped-marketing-strategy))

Also designed in: zero-friction onboarding (one name field, remembered locally), a recognizable repeatable format (three inks, one layout — the Wordle grid property), and an accession number stamped on every card so the artifact feels filed, owned, real.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest — payload codec, search, store validation
npm run build      # production build
```

### The live shelf (production)

Without any setup the site runs in **offline mode** (URL-carried lines, seed feeds, local shelf). To make lines and books shared and realtime, connect Upstash Redis — free tier, two env vars, no SDK:

1. Create a database at [upstash.com](https://upstash.com) (REST API enabled by default).
2. Set the two variables it shows you:

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

That's it — the API routes (`/api/books`, `/api/books/[slug]/lines`, `/api/recent`) switch to Redis, rate limits kick in (8 lines/hour and 4 books/hour per IP), and every feed goes live. The codec and card components don't change; only the source of truth does.

### Deploy

Push to GitHub → import in [Vercel](https://vercel.com/new) → set the env vars above plus `NEXT_PUBLIC_SITE_URL=https://your-domain.com` (used for canonical share URLs). No database to provision, no API keys beyond the two above. All 110 curated book pages, composer surfaces, and book OG images are prerendered at build; `/l/[id]` and the API render on demand.

## Project structure

```
src/
├── app/
│   ├── page.tsx                     # hero, live ticker, ink band, the shelf
│   ├── b/[slug]/page.tsx            # book page: cover, inline composer, live lines
│   ├── l/[id]/page.tsx              # the card page — every share lands here
│   ├── l/[id]/opengraph-image.tsx   # satori card (X/WhatsApp preview)
│   ├── b/[slug]/opengraph-image.tsx # book OG (spine + invitation)
│   ├── api/
│   │   ├── books/route.ts           # GET all books · POST add a book
│   │   ├── books/[slug]/lines/      # GET + POST everyone's lines for a book
│   │   └── recent/route.ts          # GET freshest lines across the shelf
│   ├── shelf/page.tsx               # "my lines" — local, private
│   └── sitemap.ts / robots.ts       # SEO plumbing
├── components/                      # LineCard, BookSpine, BookCover, BookLinks,
│                                    # StampMark, Composer, LinesFeed, RecentFeed,
│                                    # ShelfExplorer, ShareRow…
└── lib/
    ├── books.ts                     # 110-book dataset + instant search
    ├── store.ts                     # Store interface: RedisStore (Upstash REST) +
    │                                #   MemoryStore (offline dev) + rate limiting
    ├── line.ts                      # payload codec + lineSlugId (short link ids)
    ├── bookmeta.ts                  # free-archive resolver: Open Library →
    │                                #   Internet Archive → drawn spine fallback
    ├── inks.ts                      # the three card inks (paper/midnight/moss)
    ├── canvas.ts                    # 1080×1350 PNG export
    ├── seeds/                       # 1,100 editorial seed lines — ten per book
    └── use-poll.ts                  # visibility-aware polling hook
public/fonts/                        # Fraunces + IBM Plex Mono TTFs (canvas + satori)
```

## Design language

Library catalog card: warm paper (`#f2ecdd`), ink (`#211d17`), stamp vermilion (`#b23c25`), double-rule borders, Fraunces for the line and IBM Plex Mono for the ledger. The full guide lives in [docs/brand-guidelines.md](docs/brand-guidelines.md). Domain model in [CONTEXT.md](CONTEXT.md).

## Notes & limits

- Seeded lines are **editorial** — original reader takeaways written for the product, not excerpts from the books.
- `/l/[id]` payloads are validated (version, slug, lengths, ink, date) and capped; the page additionally checks the book exists on the current shelf before rendering. All rendering is text-only via React/satori (no HTML injection surface).
- Reader-added books get a slug from their title (collision-safe), a generated spine color, and a `reader-added` tag you can filter the shelf by.
- The card codec validates structure only; `findBook` decides existence — so the shelf can grow forever without invalidating old links.

## Credits

Type: [Fraunces](https://fonts.google.com/specimen/Fraunces) (Undercase Type) & [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) (IBM/Bold Monday), both OFL.
