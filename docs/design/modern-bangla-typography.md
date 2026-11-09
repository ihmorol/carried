# Modern bilingual typography research

## Observed websites

Inspected live rendered styles with gstack on 2026-11-09. These are observations, not copied assets or brand endorsements.

| Website | Observed Bengali family | Supporting Latin family | Spacing |
|---|---|---|---|
| https://10minuteschool.com/ | Anek Bangla | Inter | Normal tracking; common labels 14px/21px, body 16px/24px |
| https://shikho.com/ | Baloo Da 2 | HK Grotesk | Normal tracking; common UI 16px/24px, prose 18px/30.6px |

Anek Bangla is selected for Carried's Bengali text because its cleaner proportions suit a compact reading workspace. Baloo Da 2's rounder character is not used. Manrope supplies a proportional Latin companion. Neither observed website is a source for downloadable proprietary fonts.

## Font sources and licenses

The source files were downloaded from the official Google Fonts repository, branch `main`, observed commit `5bb28733cec313b63fbd415b574b5ae35c8aa8b8`:

- `ofl/anekbangla/AnekBangla[wdth,wght].ttf`, Ek Type / Anek Project Authors.
- `ofl/manrope/Manrope[wght].ttf`, Manrope Project Authors.

Both ship under SIL Open Font License 1.1. Full notices are preserved in `public/fonts/AnekBangla-OFL.txt` and `public/fonts/Manrope-OFL.txt`. Static 400, 500, and 600 weights were instantiated locally using fontTools; Anek width is 100. Matching WOFF2 copies are for web loading; TTF files serve canvas and OG rendering. Glyphs were not removed.

## Applied rules

- UI, quotes, metadata, signatures, and book names use proportional type, not monospace.
- Bengali letter spacing is normal. Latin body and card metadata use normal spacing; only page headings may have slight optical tightening.
- No forced all-caps metadata or italic quote styling.
- Compact cards group the quote, provenance, and ownership details; valid long text still wraps without truncation.
- Web, PNG, and OG use the same font versions and shared content/script decisions.
- Former fonts remain in source history and existing assets for compatibility but are no longer the active visual system.
