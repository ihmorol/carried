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
    fontFamily: "Manrope, Anek Bangla, sans-serif"
    fontSize: "clamp(30px, 3.2vw, 42px)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.025em"
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

This revision explicitly replaces the former letterpress type, sepia palette, wide tracking, and oversized card gaps. Do not restore those rules from historical documents.

## Colors

The shelf uses pale neutral `paper`; the line sector is near-white `paper-raised`. Dark charcoal supports readable content. Coral is one accent family: `accent` for the active navigation circle, `stamp` for readable focus/ownership text, and `stamp-soft` for subtle selection fills. Do not give every category a new interface color.

Artifact styles remain `paper`, `midnight`, and `moss`; exact colors come only from `src/lib/inks.ts`. Moss is now a pale sage card, not a dark green slab. Book-cloth colors are content, not additional interface accents. All small text must pass 4.5:1, including text drawn into books.

## Card editions

Three immutable editions change composition and ownership treatment while ink stays a separate choice: **Bookplate** (centered inscription, stepped frame, oval ownership seal), **Poster** (reversed-ink full-bleed quote, coral band, angled stamp), and **Reader's ticket** (die-cut stock, perforation, book stub, circular cancellation mark). Editions live in `src/lib/card-templates.ts` (`bookplate-v1`, `poster-v1`, `ticket-v1`) and ride in the line payload as `ct`.

Payloads without `ct` predate editions: their serialization and identity never change, and renderers present them with the house edition (Bookplate) as a display-only mapping. New cards always write an explicit id after the book metadata. One shared geometry in `text-layout.ts` (`layoutEditionArtwork` 360×450 print space, `layoutEditionOg` 1200×630) feeds DOM, canvas PNG, and OG; per-edition dense layouts preserve every character at readable floors instead of shrinking. Vote and utility actions render outside the painted artwork in page tokens.

## Typography

Use locally hosted **Manrope** for Latin and **Anek Bangla** for Bengali, weights 400/500/600. See [research and licenses](docs/design/modern-bangla-typography.md). Anek Bangla was observed on 10 Minute School; Shikho's Baloo Da 2 was compared but not selected.

Body and fields are 16px, UI/metadata 12–14px, card quotes 20–24px, and headings approximately 30–42px. Bengali tracking is always normal; card labels and signatures also use normal tracking. No forced all-caps labels, monospace prose, ornamental italics, or oversized quote marks. Bengali card leading is 1.5 and Latin card leading is 1.4. Script-specific font choices remain independent for quote, book, author, and name.

WOFF2 files serve web text; matching static TTFs serve canvas/OG. Bengali weights load as needed. Old font files remain historical assets, not the active type system.

## Layout

The desktop navigation rail is 76px, or 200px when expanded with the bottom hamburger. The rest of the homepage splits 58% shelf and 42% lines with aligned header/body/footer backgrounds. Use a single normal document scroll. Below 1024px, stack sections and provide Shelf/Lines jump links; do not hide either behind fake tabs.

The shelf is cover-led: front-facing 2:3 covers on a shared ledge with title/author captions, a featured book with its real cover, and resolved-cover artwork only for displayed books. Cover lookups go through `/api/covers` (bounded, identity-checked, cached) with labeled authored typographic fallbacks in the book's cloth color; unresolved books never fall back to spines or random art. Cover images are display-only and never merchandise assets.

The left sector has one search, compact welcome and book spotlight, genre filters, eight initial books and show-more. The right has the actual daily line, book/writing action, and three linked reader reflections. No duplicate marketing bands, calendars, reading-progress bars, invented profiles, or avatar rows.

General page gutters use 20–40px, groups 16–24px, and sections 28–36px. Component grids respond to sector width, not only viewport width. Original URLs, `#shelf`, `#write`, `#lines`, and `#main-content` remain; home adds `#reader-lines`.

## Elevation & Depth

Light shadows belong to physical book/card artwork only. Remove grain, ornamental drift, glass, and gradients. The interface relies on clear surface separation, not piles of raised boxes. Motion is limited to short press feedback; reduced motion disables it.

## Shapes

Controls are 10px and panels 14px. The active rail icon is a 44px circle. Card artwork follows its immutable edition: the Bookplate's stepped frame/oval seal, Poster's angled stamp, and Ticket's die-cut stock/cancellation. Do not apply the interface's generic panel radius or signature shape to those painted surfaces.

## Components

- Navigation: consistent outline icons with accessible names, hover/focus labels when collapsed, active state, bottom expand/collapse button, and mobile Escape/focus dismissal.
- Cards: fixed 4:5 collectible artwork with fitted text and edition-specific furniture; utility actions and readable companion provenance sit outside it. Do not stretch artwork or spread internal sections with `flex-1`.
- Exports: shared print-space geometry and canonical portrait line breaks place complete text and ownership marks consistently in DOM/PNG. OG uses the same content and visual identity in an explicit landscape adaptation. Test actual raster output, font shaping, units, and alignment, not only file dimensions.
- Shop previews: actual card artwork fits within the product print area with a ResizeObserver; do not stretch it to fill a fixed-height mockup.
- Forms and feeds: retain native radios, serial visible-tab polling, local-storage validation/fallback, useful empty/error states, and truthful offline/editorial status.

## Do's and Don'ts

Do keep digital cards, all styles, downloads, and sharing free. Do preserve original line identity, book provenance, signatures, local shelves, and cart contents. Do use bilingual readable text and 44px controls.

Do not add prices, checkout, orders, or delivery promises to the concept shop. Do not reproduce book covers or reader submissions as merchandise without commercial clearance. Do not mistake passing code tests for visual acceptance.
