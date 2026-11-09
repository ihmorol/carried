# Carried brand guidelines

The identity in one sentence: **the line a book left in you, made yours.**

## Voice

Warm, direct, literary without ornament. Use plain action labels and short sentences. No fake urgency, fake statistics, promises of virality, or sales claims for unlaunched products. Digital creation, all three styles, downloading, and sharing remain free.

## Palette

The reading reference defines a pale-neutral shelf and a near-white line sector. Use charcoal text and one coral accent family.

| Token | Hex | Use |
|---|---|---|
| paper | `#f1f1e7` | shelf/page background |
| paper-raised | `#fffefa` | line sector, inputs, paper card |
| surface-soft | `#e7e8df` | quiet grouping |
| ink | `#26292f` | primary text and controls |
| ink-soft | `#60646c` | supporting text |
| ink-faint | `#6b7077` | readable placeholders |
| rule | `#dbddd4` | separators |
| stamp | `#bf4654` | readable accent text and focus |
| accent | `#e66b77` | active sidebar circle |
| stamp-soft | `#f5d9dd` | selected-control tint |

The `paper`, `midnight`, and `moss` style identifiers remain stable. Their exact artwork colors come from `lib/inks.ts`. Moss is pale sage. Colorful book cloth is content, not a license for rainbow UI controls.

## Type

Manrope and Anek Bangla, locally hosted at 400/500/600. Bengali uses normal letter spacing and script-safe line height. Latin prose and all card metadata also use normal tracking. No forced italic quotes, all-caps ledger labels, tiny monospace prose, or excessive letter spacing.

The former Fraunces/Plex letterpress system is superseded by the user's explicit typography revision. Research and full font licensing details are recorded in `docs/design/modern-bangla-typography.md`; the active system is in `DESIGN.md`.

## Signature elements

1. The authored line, book title/author/year, and reader name/date remain complete.
2. A compact horizontal ownership block uses a thin coral border; it no longer rotates or dominates the card.
3. The accession number remains derived from the line's identity.
4. A restrained double border distinguishes Carried artwork without big shadows or grain.
5. Book-spine artwork remains a fast, reliable source-independent book representation. No commercial cover-art license is implied.

## Layout and interaction

The home is a whole-page shelf/lines split, not another marketing hero. The sidebar is narrow with regular outline icons, a coral active circle, and a bottom hamburger that reveals labels. Preserve accessible labels and keyboard use in both sizes. On mobile, stack the sectors and provide clear jump links.

Content determines card height. Do not insert empty fixed regions between short quotes and their attribution. DOM, PNG, OG, and merchandise previews share content/type decisions. Respect reduced motion; never animate readable cards continuously.

## Boundaries

No accounts, tracking, new locale cookies, gradients, or glass. The personal shelf and merchandise concept cart remain device-local. Physical ordering remains disabled until business, fulfillment, payment, rights, and policy details are supplied and approved.
