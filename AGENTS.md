# AGENTS.md

Guidance for AI agents working in this repository.

## What this is

**Carried**, a no-account quote-card site. Readers pick a book, write the one
line it left in them, stamp it with their name, and share a designed card.
Start with [`CONTEXT.md`](CONTEXT.md) (domain model) and
[`docs/brand-guidelines.md`](docs/brand-guidelines.md) (identity rules) before
making changes.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` at the root + `docs/adr/`. See `docs/agents/domain.md`.

## Non-negotiables

1. **No accounts, no server-side user data.** A line is a payload + a name; the
   visitor's shelf lives in their localStorage. Do not add tracking, cookies,
   or auth.
2. **The three rendering surfaces of a line must stay identical**: DOM card,
   canvas PNG, satori OG. Changes to card design must update `LineCard`,
   `lib/canvas.ts`, and `l/[id]/opengraph-image.tsx` together.
3. **Validate at the boundary.** `decodeLine` validates structure (404 on
   garbage); `findBook` decides book existence; the store re-validates
   server-side (`validateLineInput` / `validateBookInput`). Never trust the URL
   or the body.
4. **Design rules are in the brand doc.** Two typefaces, three inks, one accent.
   If a diff introduces a gradient or a fourth color scheme, it's wrong.
5. **Tests for pure logic.** The payload codec, search, and store validation
   have vitest coverage (`npm test`); keep it that way.

## Environment

```
NEXT_PUBLIC_SITE_URL        # canonical origin for share URLs (production)
UPSTASH_REDIS_REST_URL     # optional, enables the global live shelf
UPSTASH_REDIS_REST_TOKEN   # optional, pair with the URL above
```

Without the Upstash pair the site runs in offline mode (MemoryStore:
URL-carried lines, seed feeds, local shelf). Commands:

```bash
npm run dev     # dev server
npm run build   # production build
npm test        # vitest
npm run lint    # eslint
```

## Conventions

- App Router + TypeScript strict. Server components by default; `"use client"`
  only for state (composer, share row, shelf, search).
- Tailwind v4 theme tokens in `globals.css` (`@theme`), use tokens
  (`var(--color-ink)`, `font-serif`, `font-mono`), not raw hexes.
- Params are Promises in Next 16: `const { slug } = await params;`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes, APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`, verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
