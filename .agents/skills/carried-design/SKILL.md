---
name: carried-design
description: Implement or refine Carried's book shelf, card editions, composer, sharing, and concept shop. Use for Carried UI/UX fixes, mobile polish, accessibility, bilingual typography, or card rendering changes. Preserve the approved identity and verify the real artifact, not a generic redesign.
---

# Carried design

## Start from the product

Read `AGENTS.md`, `CONTEXT.md`, `docs/brand-guidelines.md`, and `DESIGN.md`. Treat the accepted card-edition section and current brand as authoritative over historical letterpress/intrinsic-card guidance. Read the relevant installed Next guide in `node_modules/next/dist/docs/` before changing framework behavior.

Carried turns a reader's own line into a collectible card. The card is the product; save/share reliability and readable provenance outrank decoration.

Keep:
- Manrope and Anek Bangla, normal script-safe tracking, locally hosted fonts.
- Pale-neutral reading surfaces, charcoal text, one coral accent family.
- Bookplate, Poster, and Ticket; Paper, Midnight, and Moss.
- Cover-led discovery, a desktop shelf/lines split, and one document scroll.
- No accounts, tracking, locale cookies, checkout, payments, or fabricated social proof. Shop is explicitly a device-local concept collection.

Do not add gradients, glass, grain, ornamental motion, decorative card mosaics, generic marketing bands, extra typefaces, or unlicensed merchandise cover art. Improve hierarchy by moving or removing content, not adding chrome.

## Work in coupled units

1. Inspect the affected component and its callers. Preserve unrelated changes.
2. Write a regression for a reproducible behavior failure before fixing it. CSS defects also need a real browser reproduction.
3. Repair the smallest coherent unit, including error/empty/loading states and bilingual copy.
4. Run focused tests, then use the `carried-visual-qa` procedure for painted output.
5. State what passed and what remains unverified. Do not commit, push, or deploy without separate permission.

### Card changes

The coupled surfaces are:
- `src/components/LineCard.tsx`: semantic DOM.
- `src/lib/canvas.ts`: 1080×1350 PNG.
- `src/app/l/[id]/opengraph-image.tsx`: 1200×630 landscape social preview.

Reuse `cardPresentation`/`cardFontFamily` in `src/lib/card-presentation.ts`, ink tokens in `src/lib/inks.ts`, and `layoutEditionArtwork`/`layoutEditionOg` in `src/lib/text-layout.ts`. Keep geometry in print pixels; convert once with `editionCqw` or the export scale. Never paste a cqw number into canvas as a pixel size.

Match text, alignment, line breaks, metadata, ownership marks, and dense furniture across adapters. Check the actual painted text, not only assigned color tokens. PNG alignment must consider both horizontal anchor and vertical baseline. Satori supports a CSS subset; explicitly bound and align flex children. Loading a Bengali font is not evidence that conjuncts are correctly shaped.

Do not mutate legacy payloads by adding an absent edition. Original words, book metadata, name/date, and URL identity stay intact. Restyling makes a new copy; shop personalization retains its own source/date contract.

### Responsive composition

Use shrinkable grid tracks and `min-width: 0`; constrain cards to their containers rather than hiding horizontal overflow. Keep mobile controls at least 44px where practical and page prose/fields at 16px. Metadata outside miniature art should be readable at 12–14px or larger. A scaled artwork thumbnail is decoration, not a substitute for readable text.

Expose creation before a long mobile catalogue. Keep native edition radios compact and pair them with one clear selected proof. Put the shop's single selector before the catalogue on mobile, not a duplicate mobile instance. Preserve meaningful focus order and visible focus states.

### Recovery is design

Keep raw drafts separate from validated proof content. Over-limit text remains editable; a failed preview must not remount the form. Never silently submit a shortened placeholder.

Treat card creation and local persistence as separate outcomes. If saving fails, say so and provide copy/download/local-retry recovery. A retry must not republish the line. Validate URLs and bodies at their existing boundaries. A valid payload-only book must not lead to a dead restyle route.

## Deliver

Use `references/acceptance.md` for the finish gate. Provide a brief change summary, exact test results, representative before/after evidence, and remaining limitations. “Polished” is a conclusion from the visible result, not from green mocked tests.
