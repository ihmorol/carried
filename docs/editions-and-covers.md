# Collectible editions and cover shelf

This revision implements the user-approved design board (`src/design-preview/`, kept gated at `/design-preview`) as production behavior.

## What shipped

- **Three card editions** — Bookplate, Poster, Reader's ticket — with distinct compositions and ownership marks, each available in all three inks (nine free combinations).
- **A Design picker** in the composer with live previews of the typed line, plus design selection in the shop personalizer with provenance retained.
- **Restyle as new copy**: a shared card links to the composer prefilled with its words, signature, ink, and edition; the new copy gets its own URL while the original stays untouched.
- **Edition in the payload**: validated optional `ct` after the book metadata. Absent `ct` keeps legacy serialization byte-for-byte; renderers show the house edition without writing it back. Store dedupe and cart identity treat editions as distinct cards.
- **Cover-led bookshelf**: front-facing covers on ledges for the homepage shelf and featured book, resolved only for displayed books through `/api/covers` (≤24 lookups, identity-checked title/author, 7-day hit / 1-hour miss cache, 4-second deadline, never throws), with labeled authored typographic fallbacks. The four verified edition records are in `public/covers/SOURCES.md`.

## Verification

- 177/177 tests passed, including 35 rendering regressions (per-edition geometry, legacy-default mapping, maximum 220/24/90/60 bilingual content, real OG bytes per edition), 21 resolver tests, and 31 interaction tests.
- ESLint, TypeScript, and production build passed.
- Browser checks on the integrated build: shelf covers load (including resolved Animal Farm, Mockingbird, Gatsby, Catcher, Brave New World), a Poster-edition card composed through the UI rendered on its shared page with actions outside the artwork and a working restyle link, the shop personalizer carried the edition, OG generated 1200×630 for the edition-bearing line, and no mobile overflow or axe violations on tested states.
- The earlier full-page screenshot showing blank cover plates was a lazy-load capture artifact, not a defect; scrolled verification showed all covers loaded.

## Notes and limits

- Edition credits show title and author (matching the approved board); the year remains in payload and page metadata. Brand guidance updated accordingly.
- Dense-mode fitting uses slightly tighter insets than the board so maximum bilingual input fits without dropping a character; normal content renders at board geometry.
- Cover resolution trusts only identity-verified matches; a confident mismatch is never served. Covers are display-only, and none of this grants merchandise reproduction rights.
- The design-preview board remains gated (`CARRIED_DESIGN_PREVIEW=1`) and noindexed for future design iterations.
- Local stale preview processes repeatedly survived their launchers on this machine; each was verified by command line before stopping.
