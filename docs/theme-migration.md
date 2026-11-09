# Reading-room migration

This document records the first migration. Its visual choices were subsequently revised: see [the current bilingual workspace revision](bilingual-workspace-revision.md) and `DESIGN.md` for the active fonts, colors, cards, and split layout.

## What changed

The letterpress landing page becomes a calmer, task-led reading room. The wordmark, library-card artwork, three inks, original URLs, local shelves, and free digital sharing stay intact.

| Before | After |
|---|---|
| Large marketing headline and moving card pile | Compact welcome/search with an actual daily card |
| Long unpaged book-spine wall | Labeled book tiles, combined filters/search, 24-result show-more |
| Header links hidden at small widths | Desktop labeled rail and reachable mobile menu |
| Tiny tracked form labels | 16px fields, clearer labels, native ink radios, inline errors |
| Remote cover lookup before writing renders | Compact spine intro and streamed optional book-access links |
| Moving recent ticker | Three static recent/editorial reflections with accurate state |
| Read-once local shelf | Validated searchable/sortable collection and tab synchronization |
| No physical-product path | Explicit merchandise concepts, personalization, local cart |

Theme, type, spacing, structure, component hierarchy, and artwork rules are in [DESIGN.md](../DESIGN.md). Product boundaries are in [PRODUCT.md](../PRODUCT.md); domain behavior remains in [CONTEXT.md](../CONTEXT.md).

## Compatibility

- Existing `/`, `/b/[slug]`, `/l/[id]`, `/shelf`, `#shelf`, `#write`, and `#lines` destinations remain.
- Payload version remains 1. Existing short/legacy base64 line URLs resolve. New MemoryStore user lines carry the payload in their URL, rather than an instance-local slug.
- Existing `carried.shelf.v1` and `carried.name.v1` storage stays unchanged. Corrupt entries do not crash the shelf; valid legacy entries without book metadata retain a recovery link.
- New `carried.cart.v1` is separate. No customer/delivery/payment data is collected.
- Language preference is local. The old known locale cookie is migrated/expired; no new locale cookie is set.
- User line pages remain noindexed and are no longer listed in the sitemap. OG sharing remains enabled.

## Bugs corrected

| Area | Correction | Evidence |
|---|---|---|
| Multilingual URLs | Shared 4096-character encoded bound supports maximum valid Bengali line/name/book metadata | `core-regressions.test.ts` |
| Structural validation | Null/wrong types, invalid inks/calendar dates, malformed book metadata rejected | Core/store regressions and API validators |
| Short IDs | Non-Latin fallback bounded; existing seed IDs retained | Core regression |
| Reader-added books | Deterministic native-title slug fallback; carried-book rendering independent of live lookup | Store regressions |
| Offline public feed | New user-line IDs self-contained across instances | Store regression |
| Redis transport | Pipeline uses nested command arrays; command errors no longer silently zeroed | Mocked REST contract test |
| Redis dedupe/data | Exact payload identity includes ink/date/meta; records/books parsed defensively | Store implementation |
| Composer | Reader-added proof carries metadata; native radios and explicit validation | Interactive regressions |
| Font/export | Explicit cached font registration with retry; grapheme-safe full-text fitting | 20 artwork regressions |
| Rendering parity | Native titles/authors and date/script decisions shared | Artwork matrix tests |
| Search | Numerical/native/reader-book names supported; query and tag combined; empty stays empty | Core/interactive regressions |
| Votes | Persistent session fallback, polled count sync, optimistic rollback, card-ink colors | Interactive regressions |
| Polling | Serial visible-tab polls, abort obsolete requests, route-state reset | Interactive regressions |
| Sharing | Correct URL after navigation, clipboard fallback, error versus cancellation, timer cleanup | Interactive regressions |
| Local memory | Strict payload parsing, shelf events, session fallback | Interactive/commerce regressions |
| Commerce | Exact personalization identity, validated cart edit/quantity/variant/URL limits | 16 commerce regressions |
| Content/navigation | Bengali broken labels fixed; archive destinations labeled correctly; cover resets | Interactive regressions |

## Verification and limits

Baseline: 44 tests, ESLint, and production build passed. Final migration: 115 tests, ESLint, TypeScript, and production build passed. A temporary lint failure came from generated browser-audit scripts, not application code; `.zcode/review/**` is now excluded from lint.

Local simulated-mobile Lighthouse improved from 75 to 99 performance after converting existing web fonts to WOFF2 and loading Bengali companions on demand. The final run measured LCP 0.9s, CLS 0.031, and total blocking time 110ms, with 100 accessibility, best practices, and SEO. These are local lab results, not field Core Web Vitals guarantees. TTF sources remain for canvas and OG; the WOFF2 copies reduce the font-file total from 1,777,380 to 644,516 bytes.

Browser captures/checks use gstack. The pre-existing development process served stale CSS, so visual acceptance uses an isolated production preview. No production Redis or payment service was contacted. New transport tests use local mocks.

Automated local axe checks found zero WCAG A/AA violations in the tested home, shop, book/composer, and cart states. This is not a claim of exhaustive accessibility certification. Desktop/mobile journeys cover actual card creation, personalization, local cart, and shelf behavior. Keyboard search for `1984` reaches `/b/1984#write`; browser cart checks confirmed save, quantity change, edit-in-place without duplicates, and removal. Phone, tablet, compact desktop, and landscape checks found no horizontal overflow.

Actual canvas PNGs were rendered for Paper, Midnight, and Bengali Moss. The configured visual-judge provider was unavailable; direct image inspection was used as the fallback. Independent fresh code review could not run because of provider rate limits. Those limits are disclosed, not counted as passes.

Production dependency audit: zero vulnerabilities. Development tooling has eight moderate findings from the lint/minimatch chain; npm suggests a major-version config downgrade, so no force fix was applied.

Open launch work: commercially cleared product photography/content and fonts, real products/prices, merchant details, print proof/specs, payment confirmation, fulfillment, taxes, delivery/returns/support/privacy policies. Browser-native sharing remains platform-dependent; actual iOS/Android-device testing is still needed. Redis concurrent writers need staging-level verification before a high-volume launch.
