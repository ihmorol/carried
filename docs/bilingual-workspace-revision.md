# Bilingual workspace revision

This revision responds to the user's rejection of wide letter spacing, tall card gaps, ornamental fonts, sepia colors, and the previous stacked layout. It supersedes those visual choices from the first migration, while keeping functionality, free digital use, URLs, and local data compatible.

## Typography research and selection

Live computed styles were inspected on 10 Minute School and Shikho. The former uses Anek Bangla with normal tracking; the latter uses Baloo Da 2 with normal tracking. Carried uses Anek Bangla plus Manrope at 400/500/600. Source and license details: [modern Bangla typography](design/modern-bangla-typography.md).

## Changes

- Whole-page 58/42 shelf/lines split; one document scroll and mobile jump links.
- 76px outline-icon sidebar, coral active circle, bottom hamburger expansion to 200px.
- Proportional sans text, natural Bengali tracking, compact line height, no forced italic/all-caps card ornament.
- Content-derived card geometry across DOM, PNG, and OG, with the complete group centered in export frames rather than fixed blank quote bands.
- A compact horizontal ownership block retains the name and date.
- Pale-neutral and near-white sectors, charcoal controls, one coral accent family; Moss is a light sage style.
- Shop artwork scales its complete intrinsic card instead of stretching its height.
- Book-spine text no longer fades into low-contrast backgrounds.

## Verification

- 130 tests passed across 8 test files, including 25 card-rendering and 10 new workspace tests.
- ESLint and TypeScript passed. Production build passed.
- Actual local-font PNG and OG generation checked for short and maximum Latin/Bengali/mixed inputs.
- Desktop/mobile renders inspected. Bottom expansion measured 76px/200px; the 1024px expanded layout and 768px tablet had no horizontal overflow. Mobile Escape closes the menu and returns focus to its button.
- Final local axe checks: zero WCAG A/AA violations for tested homepage and product-personalizer states.
- Local simulated-mobile Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100. LCP 0.8s, CLS 0.052, total blocking time 110ms. Lab evidence is not a field-performance guarantee.
- Design detector returned documentation-scale advisories only, not styling errors. Export image inspection was performed directly because the configured document visual-judge provider was unavailable in this session. A fresh general-purpose visual reviewer compared the final desktop/mobile website captures with the user's reference and returned **ship**, with no material mismatches visible in those captures.

## Preview cache note

This installed Next version retained an old `.next/server/route-cache` while builds changed. An old local production process also survived its launcher. The exact owned preview processes were stopped and the stale generated cache preserved under untracked `.zcode/review/route-cache-before-font-revision`. No user source or browser data was removed. The current server at `http://localhost:3036` now returns the new workspace and Manrope/Anek font assets. Invalid stale captures and Lighthouse runs were not counted as acceptance evidence.

## Preserved boundaries

No new accounts, tracking, cookies, checkout, customer/address collection, or production Redis operations. The concept shop is not taking orders. Device-local shelf and cart keys are unchanged, and existing shared lines remain compatible. No public deployment or push occurred.
