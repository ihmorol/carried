# Carried brand guidelines

The identity in one sentence: **the line a book left in you, made yours.**

## Voice

Warm, direct, literary without ornament. Use plain action labels and short sentences. No fake urgency, fake statistics, promises of virality, or sales claims for unlaunched products. Digital creation, all three inks and editions, downloading, and sharing remain free.

## Palette

Keep the approved reading-room palette: butter paper (`#f5edda`), raised paper (`#fff9ee`), petrol (`#173f3c`), persimmon (`#ff8755`), and pistachio (`#d0dcaf`). Supporting token values are unchanged and recorded once in `DESIGN.md`. Petrol belongs to the rail and the featured line field, not a permanent half-page sector; pistachio supports the feature stage and shelf edges, not a cutout bookcase. The selected book's cloth changes the featured color field, not the interface's action colors.

These are **page tokens**, separate from immutable card inks. `paper`, `midnight`, and `moss` retain all artwork values in `src/lib/inks.ts`, including backgrounds `#fffefa`, `#252a34`, and `#e7eee6`, their text/rules, and coral ownership marks. Moss stays pale sage. Deep `stamp` is the readable light-surface accent; bright `accent` handles dark-surface actions/focus. No fourth ink, gradients, glass, or grain. Colorful cloth is book content, not permission for rainbow controls.

## Type and history

Three locally hosted OFL faces at 400/500/600: **Noto Serif Bengali** for bilingual display, quotes, book titles, and wordmarks; **Manrope/Anek Bangla** for the Latin/Bengali interface, labels, metadata, and reader names. Keep prose and metadata tracking normal, Bengali script-safe leading and normal tracking, and serif display tracking no tighter than -0.01em. No forced italics, all-caps ledger labels, tiny monospace prose, or excessive spacing.

The former Fraunces/Plex letterpress system is superseded. November 2026 added Noto Serif Bengali as the display voice, superseding the earlier keep-only-the-pair display rule while retaining the interface pair. Research, comparisons, and full font licensing history remain in `docs/design/modern-bangla-typography.md`; active font assets and roles are documented in `DESIGN.md`.

## Discovery and interaction

The approved sequence is **compact header → paired book/line carousel → dense full-width spine shelf → reader lines**. The sparse eight-cover grid, giant welcome, cutout bookcase, and whole-page 56/44 split are rejected history. Use a small 20–28px home headline. Header search sits beside the brand, wraps below it on mobile, and shares URL query/filter state with the shelf through `carried:search`; do not add a duplicate hero search.

Retain the detached petrol rail: 72px inside a 96px gutter, 208px inside 232px when expanded, offset 12px left and 16px top/bottom at desktop widths. Preserve outline icons, persimmon active circles, accessible collapsed labels, bottom expansion, mobile keyboard navigation, and one document scroll.

One active carousel pair keeps the book, line, signature, and links together. The book is a real closed 3D volume with front-cover, back, spine, and page planes; its front uses the bounded identity-checked cover resolver with a labeled cloth fallback. Decorative planes are hidden from assistive technology, never extra inventory. Home initially shows 20 shelf books; `/books` shows 24 and **no carousel**. Dense spines use 148px-minimum tracks, 16px column gaps, and 260–316px height. Titles wrap vertically at 14/16/18px; author/year remain readable horizontal text below.

On screens 639px and below, show the full quote and name on a solid petrol right-hand field rather than a miniature full card. Book metadata uses petrol ink on the actual cloth/paper mix. Clicking the featured book or line opens a lazy right-side Base UI modal with canonical card, Save/share actions, and real line/writing routes. Keep normal route links available without the drawer, plus modal title, close/Escape, focus containment, and return focus.

Idle rotation waits 9 seconds and stops for hover, focus/manual interaction, pause, reduced motion, hidden/offscreen state, or an open drawer. Use one visible pause/resume control; readable text and the dense shelf never drift continuously. Reduced motion removes automatic rotation, decorative loops, and slide travel; the current manual slide change keeps a short fade. Motion 14.12.0 and Base UI 1.9.0 are MIT-licensed UI dependencies. No animation-gated content, tracking, or stored motion preference. See `docs/design/motion-reading-room.md` for the revision history.

## Collectible cards

The quote, book title, **measured author/publication-year byline**, reader name/date, and identity-derived accession stay complete. Bookplate is now an open left-aligned header/quote/credit/footer with a coral signature rule, not a centered certificate or outer frame. Poster keeps its ink field and coral ownership band; Reader's ticket keeps its die-cut stub, perforation, and single-ring cancellation with simpler furniture. Do not accumulate those edition-specific marks across designs.

Preserve `bookplate-v1`, `poster-v1`, `ticket-v1`, all ink values, and payload/URL identity. DOM, PNG, OG, and merchandise previews share content/type decisions and measured geometry; landscape OG is an explicit adaptation. Fit full valid content by reserving measured credit/ownership space before the quote, with dense fallbacks and clearance rather than clipping. Keep the canonical portrait 4:5, never stretched to fill a page panel. Utilities and readable companion provenance stay outside the artwork; Save is primary.

Depth belongs to physical book planes, contact shadows, and the floating rail, not raised boxes around every group. Interface controls/panels/rail retain 10/14/22px radii and 44px action targets; physical book corners and card editions follow their own geometry.

## Boundaries

No accounts, tracking, new locale cookies, or private server-side customer data. Optional public sharing is distinct from the device-local personal shelf, language, and merchandise concept cart. Cover access does not establish commercial reproduction rights; cover art remains display-only and publisher covers never appear on merchandise. Physical ordering stays disabled until business, fulfillment, payment, rights, and policy details are supplied and approved. Do not treat source inspection or passing code checks as visual approval.
