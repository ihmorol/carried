# Card stage modernization — November 2026

Direction for this pass: **"laid on the desk."** The card is a physical object
resting on the reading-room table. Professional and modern come from physical
plausibility (a backing stack, a contact shadow, a settle landing), disciplined
type, and one coordinated motion system — never from gradients, glass, grain,
extra colors, or ornamental loops.

## Hard constraints (unchanged)

- The painted 4:5 artwork is **flat** and identical across `LineCard` (DOM),
  `lib/canvas.ts` (PNG), and `l/[id]/opengraph-image.tsx` (OG). 3D and motion
  live on wrappers, shadows, and planes — never inside the painted artwork.
- Inks, edition IDs, payload serialization, and measured type geometry
  (`EDITION_TYPE_REGIONS`, leadings, fit floors) do not change in this pass.
- Page tokens only: butter paper / raised paper / petrol / persimmon /
  pistachio. No gradients, glass, grain, or a fourth color scheme. Shadows are
  `color-mix` of `--color-shadow`, never black.
- Transform/opacity only. Every decorative effect is off for
  `prefers-reduced-motion: reduce`, coarse pointers (tilt), hidden tabs, and
  the reading room's `data-motion="paused|reduced"`. Content is never gated on
  animation: the default CSS state is fully landed/visible.

## A. Artwork refinement (parity across DOM / PNG / OG)

**A1. Bookplate header rule.** The Ticket already draws a hairline rule under
its wordmark/accession row. Give the Bookplate the same furniture so both open
compositions share one header language:

- `layoutEditionArtwork` exposes the rule position on `layout.header` as
  `ruleTop` (print px): `header.top + wordmarkSize * wordmarkLeading + 8`,
  spanning `header.inset .. width - header.inset`. Present for bookplate only
  (`rule: boolean` on the header struct; poster and ticket keep their own
  existing furniture).
- DOM: `.edition-bookplate-heading::after` — 1px hairline in
  `var(--edition-rule)`, mirroring the ticket heading's `::after` pattern,
  hidden in `[data-density="dense"]` (same as the ticket's dense rule).
- Canvas: `drawBookplate` strokes the same line in `ink.rule` at 1px print
  (scaled), skipped when dense.
- OG: the bookplate branch adds a `borderTop: 1px solid ink.rule` div at the
  measured position, same inset/width.

**A2. No other furniture changes.** Poster keeps its band; ticket keeps its
stock, perforation, and single-ring cancellation. No ornament accumulation.

## B. The card stage (DOM-only presentation; no parity obligations)

Upgrade `TiltCard` **in place** (keep the exported name and existing props so
call sites keep working; add props, do not break them). It becomes the stage
system for every featured card:

Structure (wrapper divs, `aria-hidden` where decorative):

```
.stage                  perspective container (1100px)
  .stage-object         tilt target; CSS vars --stage-rx/--stage-ry/--stage-s
    .stage-stack        backing sheets: translateZ(-6px)/-14px, offset 2/5px,
                        raised-paper tones, 1px rule border, rounded
    .stage-shadow       contact shadow: solid --color-shadow ellipse,
                        filter: blur(14px), opacity ~0.35; shifts/scales with
                        tilt via --stage-shadow-x/-s
    .stage-card         {children} — the canonical LineCard, untouched
```

Behavior:

1. **Tilt** — pointer move on fine pointers only, rAF-batched, max lean 6deg,
   scale 1.02. The transform reads the CSS vars so JS writes three numbers.
2. **Hover lift** — object translateY(-6px); stack sheets separate a touch
   further; shadow deepens and slides toward the light. Settle back on leave
   at 550ms with `--ease-out-soft`.
3. **Landing** — one-time entrance when the stage first enters the viewport:
   object starts lifted (translateY(-16px), rotateX(2deg), scale(0.985),
   shadow faint) and settles to rest over 620ms with the new `--ease-settle`;
   the shadow blooms to full opacity in the last third. IntersectionObserver
   with an "immediately visible" fallback; if reduced motion / no IO / JS off,
   the card is simply there. `animation-fill-mode: both` so there is no flash.
4. **Flat mode** — new `flat` prop (used in card grids): no 3D, no tilt; a
   static contact box-shadow (`--shadow-card-rest`) and a hover lift
   (`translateY(-3px)` + `--shadow-card-lift`). Cheap enough for feeds.
5. **Motion contract** — respect `data-motion="paused|reduced"` ancestors,
   `prefers-reduced-motion`, `matchMedia` absence (tests), coarse pointers.
   Keep the existing disabled-state cleanup (cancel rAF, clear transform).

New tokens in `:root` (globals.css), documented in `docs/design/motion-reading-room.md`:

```css
--ease-settle: cubic-bezier(0.22, 1.2, 0.36, 1);  /* landings only */
--dur-land: 620ms;
--shadow-card-rest: 0 1px 2px color-mix(in srgb, var(--color-shadow) 10%, transparent),
                    0 14px 34px color-mix(in srgb, var(--color-shadow) 16%, transparent);
--shadow-card-lift: 0 2px 4px color-mix(in srgb, var(--color-shadow) 12%, transparent),
                    0 24px 48px color-mix(in srgb, var(--color-shadow) 22%, transparent);
```

All stage CSS lives in a **new `src/app/stage.css`** imported by
`src/app/layout.tsx` (after globals). `globals.css` changes in this pass are
limited to the `:root` token additions above — the `.edition-*` artwork block
is owned by the card-trio workstream and must not be touched here.

## C. Where the stage is applied

| Surface | Treatment |
| --- | --- |
| Home featured carousel, line column | Full stage, landing syncs with slide entry |
| `LineDrawer` canonical card | Full stage (flat on very narrow panes if it clips) |
| `/l/[id]` hero card | Full stage (replace existing bare TiltCard wrap) |
| Composer proof | Full stage (existing TiltCard call upgraded automatically) |
| Reader-line grids (RecentFeed variants, `/lines`) | `flat` stage via CSS classes on existing markup if wrapping each tile is too heavy |
| Shelf spines | Keep their own 3D; only re-token their ground shadows to `--shadow-card-*` family where they already draw shadows |

Never wrap the artwork twice (no stage inside stage). Links stay links;
keyboard focus states keep the lift via `:focus-within`.

## D. Page alignment pass (professional/modern, tokens only)

Small, consistent polish so the room reads as one system:

- Section headings across pages share one pattern (serif title + quiet sans
  meta row); no new all-caps labels.
- Panels/drawer/mats: unified radii (`--radius-panel/--radius-control`), hairline
  `--color-rule` borders, no heavy chrome.
- Buttons keep the token system; press feedback already exists — do not add
  more.
- `FeaturedPairCarousel`, `LineDrawer`, `RecentFeed`, `ShelfExplorer`, `Chrome`,
  `HeaderSearch`, home/books/lines/shelf/`l/[id]` pages, and the reading-room/
  workspace/bookshelf stylesheets get the spacing/heading/shadow alignment.
  Shop is out of scope for this pass.

## E. Tests

- Existing suite stays green (`npm test`); update assertions that reference
  changed geometry (bookplate header rule) or markup.
- Stage: wrapper renders children; disabled on mocked coarse pointer / reduced
  motion / missing `matchMedia`; `flat` mode applies its class; landing class
  appears with a visible-fallback when IntersectionObserver is absent.
- Card trio: bookplate header rule present for all three surfaces'
  expectations (layout geometry; DOM class; canvas draw call; OG region) and
  hidden in dense mode.

## F. Docs

- `docs/design/motion-reading-room.md`: record the stage system, settle
  easing, landing, and the flat grid treatment under "Current revision".
- `DESIGN.md`: add the new tokens where tokens are recorded.
- This file is the pass's record; keep it updated with what shipped.

## Shipped — stage workstream (November 2026)

- B/C: `TiltCard` rebuilt as the stage (`stage-object`/`stage-stack`/
  `stage-shadow`/`stage-card`, CSS-var transform, rAF-batched); all stage CSS
  in new `src/app/stage.css`. Full stage with landing on the featured
  carousel, `LineDrawer`, and `/l/[id]`; Composer proof keeps the full stage
  without landing (it re-keys per stamp, so a landing would replay on every
  press); reader-line grids (RecentFeed, LinesFeed, ReaderLinesFeed, shelf
  page, `/l/[id]` others) use the CSS-only flat treatment via a shared
  `line-card-grid` class. The legacy `.tilt .edition-artwork` shadow rules in
  `globals.css` were removed with the old markup (hardcoded rgb retokened
  away); spine ground shadows now derive from `--color-shadow` instead of
  `#140f08`.
- D/E/F: heading/radii token alignment on home/books/lines/shelf; new
  `stage.test.tsx`; owned suites updated; docs above updated.
