---
name: Carried
description: A modern bilingual workspace for books and the lines they leave
colors:
  paper: "#f1f1e7"
  paper-raised: "#fffefa"
  surface-soft: "#e7e8df"
  ink: "#26292f"
  ink-soft: "#60646c"
  ink-faint: "#6b7077"
  rule: "#dbddd4"
  stamp: "#bf4654"
  stamp-soft: "#f5d9dd"
  accent: "#e66b77"
typography:
  display:
    fontFamily: "Noto Serif Bengali, Manrope, Anek Bangla, serif"
    fontSize: "clamp(30px, 3.2vw, 42px)"
    fontWeight: 500
    lineHeight: 1.2
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
  card: "12px"
  control: "10px"
  panel: "14px"
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
---

# Carried design system

## Overview

Carried is a modern bilingual reading workspace. Its two sectors put the shelf on the left and the daily line plus reader reflections on the right. The product remains a place to author and share a line, not a reading tracker, social profile, or payment application.

This revision explicitly replaces the former letterpress type, sepia palette, wide tracking, and oversized card gaps. Do not restore those rules from historical documents. The November 2026 refinement adds Noto Serif Bengali as the display voice; it does not restore any letterpress rule.

## Colors

The shelf uses pale neutral `paper`; the line sector is near-white `paper-raised`. Dark charcoal supports readable content. Coral is one accent family: `accent` for the active navigation circle, `stamp` for readable focus/ownership text, and `stamp-soft` for subtle selection fills. Do not give every category a new interface color.

Artifact styles remain `paper`, `midnight`, and `moss`; exact colors come only from `src/lib/inks.ts`. Moss is now a pale sage card, not a dark green slab. Book-cloth colors are content, not additional interface accents. All small text must pass 4.5:1, including text drawn into books.

## Card editions

Three immutable editions change composition and ownership treatment while ink stays a separate choice: **Bookplate** (centered inscription, one hairline plate rule, type-only ownership with a coral signature rule), **Poster** (reversed-ink full-bleed quote, coral band carrying a straight credit line), and **Reader's ticket** (die-cut stock, perforation, book stub, single-ring circular cancellation mark). Editions live in `src/lib/card-templates.ts` (`bookplate-v1`, `poster-v1`, `ticket-v1`) and ride in the line payload as `ct`.

Payloads without `ct` predate editions: their serialization and identity never change, and renderers present them with the house edition (Bookplate) as a display-only mapping. New cards always write an explicit id after the book metadata. One shared geometry in `text-layout.ts` (`layoutEditionArtwork` 360×450 print space, `layoutEditionOg` 1200×630) feeds DOM, canvas PNG, and OG; per-edition dense layouts preserve every character at readable floors instead of shrinking. Vote and utility actions render outside the painted artwork in page tokens.

## Typography

**Noto Serif Bengali** is the display voice: headlines, section titles, and the card quote, book title, and wordmark. It covers Bengali and Latin glyphs, so quote and book title keep one face across scripts. The interface voice remains locally hosted **Manrope** for Latin and **Anek Bangla** for Bengali, weights 400/500/600, for UI, body, labels, metadata, and reader names. All three faces are locally hosted static instances under the OFL, weights 400/500/600 only. See [research and licenses](docs/design/modern-bangla-typography.md). Anek Bangla was observed on 10 Minute School; Shikho's Baloo Da 2 was compared but not selected.

Body and fields are 16px, UI/metadata 12–14px, card quotes 20–24px, and headings approximately 30–42px — the home welcome headline scales up to ~48px in the serif display voice. Bengali tracking is always normal; card labels and signatures also use normal tracking. Serif display tracking is at most -0.01em, and Bengali display tracking stays normal. No forced all-caps labels, monospace prose, ornamental italics, or oversized quote marks. Bengali card leading is 1.5 and Latin card leading is 1.4. On the card, quote, book title, and wordmark are serif; labels, reader name, author, date, and accession stay sans for legibility at 8–12px, and card geometry, weights (400–600), inks, and editions are unchanged. Author, reader name, and metadata remain script-specific between Manrope and Anek Bangla.

`--font-book` is registered in `src/app/layout.tsx` and exposed as the `--font-serif` theme token in `globals.css`. WOFF2 files serve web text; matching static TTFs serve canvas/OG. For canvas PNG export the serif is registered as "Noto Serif Bengali Export" from the same TTFs; satori OG uses "Noto Serif Bengali". `public/fonts` ships `NotoSerifBengali-400.woff2/.ttf` (newly instantiated at wght 400 / wdth 100 with fontTools) alongside the pre-existing 500/600 static instances now in active use (700 stays historical) and `NotoSerifBengali-OFL.txt`. Weights load as needed. Old font files remain historical assets, not the active type system.

## Layout

The desktop navigation rail is 76px, or 200px when expanded with the bottom hamburger. The rest of the homepage splits 56% shelf and 44% lines with aligned header/body/footer backgrounds. Use a single normal document scroll. Below 1024px, stack sections and provide Shelf/Lines jump links; do not hide either behind fake tabs.

The shelf is cover-led: front-facing 2:3 covers on a shared ledge with title/author captions, a featured book, unboxed, with its real cover at a larger size, and resolved-cover artwork only for displayed books. Cover lookups go through `/api/covers` (bounded, identity-checked, cached) with labeled authored typographic fallbacks in the book's cloth color; unresolved books never fall back to spines or random art. Cover images are display-only and never merchandise assets.

The left sector has one search, compact welcome and book spotlight, genre filters, eight initial books and show-more; the search and genre filter chips are soft-filled and borderless. The right has the actual daily line in a card widened to ~440px, book/writing action, and three linked reader reflections. No duplicate marketing bands, calendars, reading-progress bars, invented profiles, or avatar rows.

General page gutters use 20–40px, groups 16–24px, and sections 28–36px. Component grids respond to sector width, not only viewport width. Original URLs, `#shelf`, `#write`, `#lines`, and `#main-content` remain; home adds `#reader-lines`.

## Elevation & Depth

Light shadows belong to physical book/card artwork only. Remove grain, ornamental drift, glass, and gradients. The interface relies on clear surface separation, not piles of raised boxes. Motion is limited to short press feedback; reduced motion disables it.

## Shapes

Controls are 10px and panels 14px. The active rail icon is a 44px circle. Card artwork follows its immutable edition: the Bookplate's hairline plate rule/signature ownership, Poster's coral band credit line, and Ticket's die-cut stock/single-ring cancellation. Do not apply the interface's generic panel radius or signature shape to those painted surfaces.

## Components

- Navigation: consistent outline icons with accessible names, hover/focus labels when collapsed, active state, bottom expand/collapse button, and mobile Escape/focus dismissal.
- Cards: fixed 4:5 collectible artwork with fitted text and edition-specific furniture; utility actions and readable companion provenance sit outside it. Do not stretch artwork or spread internal sections with `flex-1`.
- Exports: shared print-space geometry and canonical portrait line breaks place complete text and ownership marks consistently in DOM/PNG. OG uses the same content and visual identity in an explicit landscape adaptation. Test actual raster output, font shaping, units, and alignment, not only file dimensions.
- Shop previews: actual card artwork fits within the product print area with a ResizeObserver; do not stretch it to fill a fixed-height mockup.
- Forms and feeds: retain native radios, serial visible-tab polling, local-storage validation/fallback, useful empty/error states, and truthful offline/editorial status.

## Card refinement, November 2026

Keep the reading-room structure and all three edition identities. The card should feel like a literary keepsake, not an administrative certificate. Quote hierarchy is controlled: short Bookplate/Poster/Ticket quotes start at 28/34/26 print pixels; longer inputs step down through length tiers before fitting. Full valid content and the 14px quote floor remain. Ordinary Bookplate and Poster credits use a stronger book title, 12px author, and a real 12px clearance after the quote region. Extreme input still has an explicit dense layout, not cropping.

Bookplate ownership has a bounded name width. Ticket's single-ring claim reserves the actual name corners, not just a rectangular fit; dense caption/date share a separated horizontal row below the quote. DOM and PNG carry these decisions together. OG keeps the same calmer hierarchy in landscape.

The featured book and composer are unboxed. Align groups with their own content edges; preserve field borders and visible selection/focus. Mobile jump links include writing before the catalogue. Save is primary, while individual external share destinations are quiet links. Do not turn these refinements into a replacement landing page.

Bangladesh-first channel research and its limitations are recorded in [the audience note](docs/design/bangladesh-first-refinement.md). No reader research has established a national visual preference; bilingual, mobile-safe cards are a design hypothesis supported by the product, not a demographic claim.

## Do's and Don'ts

Do keep digital cards, all styles, downloads, and sharing free. Do preserve original line identity, book provenance, signatures, local shelves, and cart contents. Do use bilingual readable text and 44px controls.

Do not add prices, checkout, orders, or delivery promises to the concept shop. Do not reproduce book covers or reader submissions as merchandise without commercial clearance. Do not mistake passing code tests for visual acceptance.
