---
name: Carried
description: A modern reading room for the line a book left in you
colors:
  paper: "#f2ecdd"
  paper-raised: "#faf6ea"
  surface-soft: "#eae4d6"
  ink: "#211d17"
  ink-soft: "#6d6354"
  ink-faint: "#766a59"
  rule: "#d8cdb6"
  stamp: "#b23c25"
typography:
  display:
    fontFamily: "Fraunces, Noto Serif Bengali, serif"
    fontSize: "clamp(32px, 4vw, 56px)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "IBM Plex Mono, Noto Sans Bengali, monospace"
    fontSize: "14px"
    lineHeight: 1.65
rounded:
  card: "4px"
  control: "10px"
  panel: "16px"
spacing:
  small: "8px"
  group: "16px"
  panel: "24px"
  section: "48px"
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

A library catalog card the reader can author, presented in a modern reading room. The interface helps readers discover, write, share, and preview merchandise concepts. It is not a reading tracker, social profile, or payment application.

## Palette

| Role | Token | Value |
|---|---|---|
| Page | paper | `#f2ecdd` |
| Raised field/panel | paper-raised | `#faf6ea` |
| Supporting surface | surface-soft | `#eae4d6` |
| Primary text/control | ink | `#211d17` |
| Secondary text | ink-soft | `#6d6354` |
| Placeholder/support | ink-faint | `#766a59` |
| Separator | rule | `#d8cdb6` |
| Ownership/action accent | stamp | `#b23c25` |

Card colors come only from `src/lib/inks.ts`. Paper, Midnight, and Moss are artifact choices. Dark card stamps use the same accessible salmon-red family, not gold. Page chrome stays print-inspired light; do not alternate dark page sections or introduce a second accent. Book-cloth colors belong to the book content.

## Type

Fraunces is the house serif for headings, book names, reflections, and signatures. IBM Plex Mono is the UI/metadata face. Noto Serif Bengali and Noto Sans Bengali are existing script companions for Bengali coverage, not a third UI style. All are locally loaded.

Headings scale from 32 to 56px; section titles from 26 to 36px. Editable fields are 16px. Supporting UI uses 12–14px. The fixed-format card artwork has its own scaled metadata sizes. Bengali avoids negative tracking and uses generous line-height. Italic text reserves descender clearance.

## Space and structure

Use a 4/8px rhythm. Gutters adapt from 16 to 40px; interface groups have 16–24px gaps; sections separate by 32–48px. Main content caps at 1360px. Desktop navigation occupies a 128px rail at widths of 1024px and up. The header is 76px; mobile uses a labeled menu. Preserve one main landmark, skip target `#main-content`, and original route anchors.

Panel radius is 16px; controls are 10px; catalog artwork retains a 4px filed edge. Pills are reserved for small filters. Shadows are subtle, warm, and only indicate physical artwork depth. The header is opaque, not frosted glass.

## Surfaces

- Home: search-led welcome, actual daily card, four discovery books, three recent reflections, paged catalog, concise writing guide.
- Book: compact spine/introduction, writing form and proof, asynchronously streamed book-access links, public margin.
- Shared line: artwork and free sharing actions, secondary merchandise concept link, same-book writing invitation.
- My lines: validated device-local collection, search and sorting, loading/empty/unresolved-legacy states.
- Shop: featured print, category strip, actual artwork placement diagrams, product grid, selected-line workspace.
- Personalizer: full artwork, line/signature/ink/placement/quantity controls, local-cart feedback, free digital download.
- Cart: editable local selections; no prices, totals, checkout, order, payment, or delivery promises.

## Interaction and state

Controls have at least 44px hit targets. Native radio inputs are used for inks and placements. Search supports click, touch, arrow navigation, Enter, Escape, and active-descendant semantics. Filters combine with queries. The catalog displays 24 results before explicit show-more.

Async work distinguishes initial loading, offline, stale, valid empty, and errors. Polls run serially only while visible and abort obsolete work. Share controls report failures without confusing them with user cancellation. Storage failure degrades to a session preference/selection rather than breaking the product.

## Motion and layers

Motion intensity 3: short press/hover feedback and the ownership stamp. No auto-moving readable cards, scroll hijacks, or carousel-as-layout. Reduced motion disables transitions. Layers: page 0, grain 10, navigation 20, header 30, menu 40, skip link 70. Cards and stamps remain readable independently of motion.

## Artwork contract

DOM, 1080×1350 canvas PNG, and 1200×630 OG share content decisions in `card-presentation.ts`, inks, script fonts, provenance, accession number, and ownership. Export text uses disjoint fitting regions and grapheme-safe wrapping. Aspect-ratio layout may differ; content may not. Valid text is never silently ellipsized in artwork. Page vote controls and shadows are not printed into export artwork.

## Asset truth

Shop shapes are flat placement diagrams with actual Carried artwork, explicitly labeled concepts. They are not manufactured sample photos or production specifications. Do not reuse book covers, publisher art, or editorial reflections for sale without clearance. No new external imagery or reader data was uploaded for this migration.
