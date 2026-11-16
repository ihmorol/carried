---
name: Carried
description: An energetic nostalgic bilingual reading room for books and the lines they leave
colors:
  paper: "#f5edda"
  paper-raised: "#fff9ee"
  surface-soft: "#e8dfc9"
  ink: "#173f3c"
  ink-soft: "#4e6259"
  ink-faint: "#58645a"
  rule: "#d8cdb5"
  stamp: "#b44125"
  stamp-soft: "#f9dfc9"
  accent: "#ff8755"
  accent-hover: "#ff9a70"
  night: "#173f3c"
  night-raised: "#24504a"
  room: "#173f3c"
  room-raised: "#214b45"
  room-text: "#fff1d2"
  room-muted: "#ccdbc8"
  room-rule: "#527166"
  library: "#d0dcaf"
  library-deep: "#aeba8c"
  shadow: "#122c29"
motion:
  ease-out-soft: "cubic-bezier(0.16, 1, 0.3, 1)"
  ease-settle: "cubic-bezier(0.22, 1.2, 0.36, 1)"
  dur-land: "620ms"
depth:
  shadow-card-rest: "0 1px 2px shadow 10%, 0 14px 34px shadow 16%"
  shadow-card-lift: "0 2px 4px shadow 12%, 0 24px 48px shadow 22%"
typography:
  display:
    fontFamily: "Noto Serif Bengali, Manrope, Anek Bangla, sans-serif"
    fontSize: "clamp(34px, 4.2vw, 54px)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  welcome:
    fontFamily: "Noto Serif Bengali, Manrope, Anek Bangla, sans-serif"
    fontSize: "clamp(20px, 1.8vw, 28px)"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  featured-book:
    fontFamily: "Noto Serif Bengali, Manrope, Anek Bangla, sans-serif"
    fontSize: "clamp(22px, 2vw, 30px)"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  section:
    fontFamily: "Noto Serif Bengali, Manrope, Anek Bangla, sans-serif"
    fontSize: "clamp(24px, 2.4vw, 31px)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, Anek Bangla, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
    letterSpacing: "normal"
  metadata:
    fontFamily: "Manrope, Anek Bangla, sans-serif"
    fontSize: "12px"
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  control: "10px"
  panel: "14px"
  rail: "22px"
  circle: "50%"
  pill: "999px"
spacing:
  small: "8px"
  group: "16px"
  panel: "24px"
  section: "36px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.night-raised}"
  button-room:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
    height: "44px"
  button-room-hover:
    backgroundColor: "{colors.accent-hover}"
  navigation-rail:
    backgroundColor: "{colors.room}"
    textColor: "{colors.room-muted}"
    rounded: "{rounded.rail}"
    padding: "16px 14px"
    width: "72px"
  navigation-rail-expanded:
    width: "208px"
  motion-control:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    height: "44px"
    width: "44px"
---

# Carried design system

## Direction

**A book becomes a personal keepsake.** The approved home is a compact header, one paired book-and-line carousel, a dense full-width spine shelf, then reader lines. The sparse eight-cover shelf, giant welcome, cutout bookcase, and whole-page 56/44 split are rejected history, not layout requirements. The floating rail, page palette, bilingual type, and free creation/sharing remain.

The current revision is recorded in [Motion reading room](docs/design/motion-reading-room.md). Its earlier direction is historical. Source authority is `src/app/reading-room.css`, `src/app/bookshelf.css`, `src/app/page.tsx`, `FeaturedPairCarousel`, `HeaderSearch`, and `ShelfExplorer`; retained legacy scene styles do not define the active home.

## Palette and depth

The frontmatter retains the approved page tokens from `globals.css`: butter paper and warm raised paper; petrol text, rail, and the featured line field; persimmon actions; pistachio stage and shelf edges. `stamp` is the readable accent on light paper, while `accent` supplies dark-surface focus. `night` is a page-only petrol alias. The featured atmosphere mixes the selected book's cloth with these page surfaces, so its field changes with the pair. Cloth is content, not another interface palette.

**Artifact boundary.** All values in `src/lib/inks.ts` remain unchanged for `paper`, `midnight`, and `moss`, including text, rules, and coral ownership marks. Their backgrounds remain `#fffefa`, `#252a34`, and `#e7eee6`; Moss stays pale sage. Page Paper/Petrol never replace card Paper/Midnight, and there is no fourth ink.

Depth comes from separate front-cover, back, spine, and page-block planes with contact shadows, not flat cutout scenery. Preserve the featured volume's `preserve-3d` tree; slide transforms belong to its outer wrapper. Real 2:3 covers use the bounded identity-checked cover resolver and labeled typographic cloth fallbacks. Covers are display-only, never merchandise assets. No gradients, glass, grain, fake reflections, or invented library inventory.

The card stage (`stage.css`) adds the landing/flat tokens above: `--ease-settle` is for landings only, `--dur-land` times the one-time viewport entrance, and `--shadow-card-rest`/`--shadow-card-lift` are the flat grid contact shadows — all `color-mix`es of `--color-shadow`, never black. Featured cards get the full stage (stack sheets, one blurred contact shadow, fine-pointer lean); reader-line grids get the flat shadow and 3px lift.

## Typography and licensing

Noto Serif Bengali is the bilingual display face for headings, card quotes, book titles, and wordmarks. Manrope/Anek Bangla remain the Latin/Bengali interface pair for body text, labels, reader names, authors, and dates. All three are locally hosted OFL faces at 400/500/600. Body and ordinary fields use 16px; header search uses 15px on desktop and 16px on mobile. The home welcome is only 20–28px at weight 500; the larger global heading role is not the home hero. Shelf headings use 28px; reader-feed headings remain 24px.

Keep normal prose, metadata, and Bengali tracking; serif display tracking is at most -0.01em. Bengali needs script-safe leading, not forced italics, all-caps ledger labels, tiny monospace prose, or clipped glyphs. Card leading and fitting come from `text-layout.ts`, not page heading presets.

The former Fraunces/Plex letterpress system, sepia treatment, and wide tracking remain superseded. November 2026's Noto Serif Bengali revision superseded the earlier keep-only-the-pair display rule, not the interface pair. [Typography research and licenses](docs/design/modern-bangla-typography.md) retain that history: Anek Bangla was observed on 10 Minute School; Shikho's Baloo Da 2 was compared but not selected.

`--font-book` in `layout.tsx` supplies `--font-serif`. Web text uses WOFF2; matching static TTFs serve canvas/OG and stay in the deployment bundle through `outputFileTracingIncludes`. Canvas registers “Noto Serif Bengali Export”; satori uses “Noto Serif Bengali”. `public/fonts` includes the fontTools-instantiated Noto Serif Bengali 400 at wght 400 / wdth 100, active pre-existing 500/600 instances, and `NotoSerifBengali-OFL.txt`. Weight 700 and former font files remain historical assets, not active faces.

## Page sequence and discovery

- **Navigation and search.** At 1024px and above, the rail remains 72px inside a 96px gutter, or 208px inside 232px when expanded. It floats 12px from the left and 16px from top/bottom, with outline icons, a persimmon active circle, collapsed hover/focus labels, and bottom expansion. Keep one document scroll and an accessible mobile menu. Header search sits beside the brand, wrapping to its own row below 768px. On `/` and `/books`, it shares URL `q`/`genre` state with the shelf through `carried:search` and `popstate`; preserve history state and anchors. Elsewhere, submission opens `/books?q=…#shelf`. Do not duplicate the catalogue search below the hero.
- **Featured pair.** One active slide owns its book, cover, line, reader name, and destinations together; the daily pick leads the editorial selection. Async `Home` resolves covers before rendering `ReadingRoom` and the carousel, avoiding a streamed replacement beneath an already hydrated motion context. A real closed 3D book faces its corresponding card, with a changing cloth-color field. Book metadata uses petrol ink against the actual cloth/paper mix. Keep title, author/year, writing access, previous/next, and book selectors useful and short. The page is not split into permanent shelf/line sectors.
- **Dense shelf.** Home starts with 20 books and `/books` with 24, followed by show-more; `/books` has no carousel. Both use full-width cloth-spine grids: 148px minimum tracks, 16px column gaps, 20px row gaps, and 260–316px volumes on a 324px art stage. Vertical titles use length-aware 14/16/18px type and wrap rather than truncate. Author and year stay horizontal below: 13px author (14px Bengali), 12px year. Real result counts, genre filters, reader-added books, and live/offline status remain.
- **Reader lines.** A full-width card feed follows the shelf; it is not the old three-reflection sidebar. Preserve truthful editorial/live provenance, real links, and early writing access. Existing routes and `#shelf`, `#reader-lines`, `#main-content`, and book-page `#write` destinations remain usable.

Below 640px, the hero shows the **full quote and reader name** against a solid petrol right-hand field, not an unreadably tiny full card. This discovery view is not a new card edition. An ordinary book/line click opens a lazy right-side detail drawer containing canonical `LineCard`, `ShareRow`, a real `/l/[id]` link, and the book's writing link. The triggering anchors retain their real route for modified clicks and no-JavaScript navigation. The Base UI modal provides titled/described dialog semantics, close/Escape, focus containment, and return focus; its width is at most 520px and fills narrow screens.

## Motion and interaction

Motion **14.12.0** (`motion/react`) supplies paired enter/exit; Base UI **1.9.0** (`@base-ui/react/dialog`) supplies the drawer. Both resolved dependencies are MIT-licensed in `package-lock.json`. These UI dependencies do not add accounts, analytics, or storage.

Idle rotation waits **9 seconds**. Hover, focus, manual selection, explicit pause, an open drawer, a hidden tab, an offscreen hero, or reduced motion stop rotation. Focus/manual inspection keeps motion paused until resumed; manual previous/next and selectors remain usable. Automatic position updates are quiet, while manual position changes may announce politely. The single visible motion control shares in-memory state and is disabled with a localized reduced-motion label.

`AnimatePresence` uses one keyed pair with `mode="wait"` and `initial={false}`. Slides use a 320ms soft-out transition with bounded travel; the current reduced-motion variant removes travel and uses a 100ms fade. Only the closed volume (9s) and decorative color field (18s) loop, gated by the carousel's rotating state. Readable text does not drift, the dense shelf does not continuously animate, and content never waits for an entrance animation. Drawer transitions and decorative CSS loops stop under reduced motion; touch does not depend on hover. No parallax or scroll hijacking.

Controls remain at least 44px; header search is 48px high. Generic control/panel/rail radii remain 10/14/22px; the featured stage has its own 20px radius. Physical book corners are separate from interface tokens. Preserve visible focus, readable contrast, forced-colors fallbacks, and motion-free print output.

## Card editions and full-content fitting

Edition IDs remain **`bookplate-v1`**, **`poster-v1`**, and **`ticket-v1`**; approved composition changes are shared across DOM, PNG, and OG, not new payload versions.

- **Bookplate:** an open left-aligned header, quote, book credit, and ownership footer with one coral signature rule. No outer certificate frame or ornamental caption.
- **Poster:** a full-bleed ink field with simpler heading/credit furniture and a measured coral ownership band.
- **Reader's ticket:** die-cut stock, perforation, book stub, and one circular cancellation; retain its identity without piling on labels or rules. Dense caption/date furniture stays out of the quote.

`card-presentation.ts` constructs the complete `author · publication year` byline (including BC years); `editionText` passes it to every renderer for measurement. Do not append the year after fitting or confuse it with the reader's stamp date. Full quote, title, byline, reader name/date, and accession remain intact.

`layoutEditionArtwork` shares 360×450 print-space geometry between the 4:5 DOM card and 1080×1350 PNG; `layoutEditionOg` provides the explicit 1200×630 landscape adaptation. Credit and ownership are measured before allocating quote space. Ordinary Bookplate/Poster quote-to-credit clearance is 16 print pixels, dense clearance at least 12, with an explicit full-content fallback rather than cropping. Short quotes start at 28/34/26 print pixels by edition; fitting retains 14px quote, 9px name, and 8px metadata floors. Maximum-content fitting must account for combined text heights, not independently overlapping regions.

A missing `ct` still maps to the house Bookplate for display only: never rewrite legacy payloads, IDs, or hashes. Keep artwork fixed in proportion, not stretched to fill a panel. Utilities, votes, readable transcripts, and companion provenance live outside it; Save remains primary and external share destinations quiet. Shop mockups use actual canonical artwork within their print area.

## Product boundaries

Keep digital creation, every ink/edition, downloads, and sharing free. No accounts, tracking, locale cookies, private server-side customer data, or new storage. The optional public shelf publishes submitted lines/names and anonymous votes; personal shelves, language, and concept-cart selections stay device-local. Preserve codec/store validation, old links, dedupe rules, and cart identity.

The shop remains concept-only: no invented prices, checkout, orders, delivery promises, or commercial rights. Public covers, quotation-like passages, translations, art, and reader submissions need appropriate clearance before merchandise use. [Bangladesh-first research](docs/design/bangladesh-first-refinement.md) records channel evidence and its limits; bilingual mobile-safe design is not proof of a national visual preference. Source alignment and passing code checks are not visual acceptance.
