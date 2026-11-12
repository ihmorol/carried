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

## Addendum: November 2026 — display serif

Noto Serif Bengali joins the system as the display voice: headlines, section titles, and the card quote, book title, and wordmark. It covers both Bengali and Latin glyphs, so the display keeps one face across scripts. The interface pair is unchanged — Manrope for Latin and Anek Bangla for Bengali remain the voice of UI, body, labels, metadata, and reader names.

The 400 weight was newly instantiated locally with the fontTools instancer at wght 400 / wdth 100, taken from the Google Fonts variable font (`NotoSerifBengali[wdth,wght].ttf`) using the same static-instance method as above. `public/fonts` now ships `NotoSerifBengali-400.woff2` and `NotoSerifBengali-400.ttf` next to the pre-existing static 500 and 600 instances, which are now in active use (700 stays historical), and `NotoSerifBengali-OFL.txt` preserves the license notice. Weights remain 400/500/600 across all three faces. Serif display tracking is at most -0.01em; Bengali display tracking stays normal with script-safe line height. The applied rules above are otherwise unchanged.
