# Carried — Brand Guidelines

The identity in one sentence: **a library catalog card you get to author.**
Every decision below serves that. If a change makes the product feel like a
generic web app, it's off-brand.

## Voice

- **Understated, literary, warm.** We sound like a well-read friend, not a growth hacker.
- Say the true small thing: "the sentence you'd underline," "the residue," "stamp it with your name."
- Never say: boost, unlock, supercharge, level up, 🚀, "unleash your creativity."
- Second person, plain verbs, short sentences. Wordplay allowed; exclamation marks rare.
- No fake urgency, no fake stats. If a count is shown it is real.

## Palette

| Token | Hex | Use |
|---|---|---|
| `paper` | `#f2ecdd` | page background |
| `paper-raised` | `#faf6ea` | cards, inputs |
| `ink` | `#211d17` | primary text, primary buttons |
| `ink-soft` | `#6d6354` | secondary text |
| `ink-faint` | `#9c917f` | metadata, placeholders |
| `rule` | `#d8cdb6` | hairlines, double-rule card borders |
| `stamp` | `#b23c25` | **the only accent** — stamps, key CTAs, focus rings |

Rules: stamp red is scarce — if everything is stamped, nothing is. Buttons are
ink-on-paper; red is reserved for the ownership moment and small emphasis.
Card inks (Paper / Midnight `#1c1814` / Moss `#2c3a30`) invert the scheme and
must come from `lib/inks.ts`, never re-derived.

## Type

- **Fraunces** (500/600 + italic) — headlines, the line itself, book titles, the name in the stamp. Serif is the voice of the book.
- **IBM Plex Mono** (400–600) — everything else: UI, metadata, buttons, labels. Letter-spaced uppercase for ledger labels (`CARRIED OUT OF`, `No. 4F2A1C`).
- No third family. Body text is mono at 12–14px with generous leading — the site is text-light by design.

## Signature elements

1. **The stamp** — "CARRIED BY ⟨name⟩ ⟨date⟩", slightly crooked (-6.5°), ink-textured, always vermilion. It's the ownership moment; it never appears without a name.
2. **The double rule** — every card gets an inner border like a filed catalog card.
3. **The accession number** — `No. XXXXXX`, minted from the line, on every card.
4. **The spine** — books are drawn as book-cloth spines with a head/foot band and edge lighting; never use downloaded cover images.

## Motion

Quiet, mechanical, satisfying: the stamp thumps in (scale 1.7 → overshoot → rest, 550ms), sections rise 14px on load, the marquee drifts slowly and pauses on hover. `prefers-reduced-motion` disables all of it. Nothing bounces for fun.

## Do / Don't

- **Do** keep the wordmark small; the reader's name is the loudest thing on the card.
- **Do** let paper grain (`/grain` overlay) sit over everything at low opacity.
- **Don't** add gradients, glassmorphism, drop-shadowed floating blobs, or emoji in UI copy.
- **Don't** introduce a fourth ink or a second accent color.
- **Don't** require an account for anything. The device remembers the name; the link carries the line.
