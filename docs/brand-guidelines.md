# Carried, Brand Guidelines

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
| `ink-faint` | `#766a59` | supporting text, placeholders with readable contrast |
| `surface-soft` | `#eae4d6` | quiet book and product display surfaces |
| `rule` | `#d8cdb6` | hairlines, double-rule card borders |
| `stamp` | `#b23c25` | **the only accent**, stamps, key CTAs, focus rings |

Rules: stamp red is scarce, if everything is stamped, nothing is. Buttons are
ink-on-paper; red is reserved for the ownership moment and small emphasis.
Card inks (Paper / Midnight `#1c1814` / Moss `#2c3a30`) invert the scheme and
must come from `lib/inks.ts`, never re-derived.

## Type

- **Fraunces** (500/600 + italic), headlines, the line itself, book titles, the name in the stamp. Serif is the voice of the book.
- **IBM Plex Mono** (400–600), everything else: UI, metadata, buttons, labels. Letter-spaced uppercase for ledger labels (`CARRIED OUT OF`, `No. 4F2A1C`).
- The two house families remain. Existing Noto Serif/Sans Bengali companions provide script coverage. Inputs/body guidance use 16px; supporting UI uses 12–14px. Artwork metadata scales with the card.

## Signature elements

1. **The stamp**, "CARRIED BY ⟨name⟩ ⟨date⟩", slightly crooked (-6.5°), ink-textured, vermilion on paper and an accessible salmon-red on dark inks. It's the ownership moment; it never appears without a name.
2. **The double rule**, every card gets an inner border like a filed catalog card.
3. **The accession number**, `No. XXXXXX`, minted from the line, on every card.
4. **The spine**, books are drawn as book-cloth spines with a head/foot band and edge lighting; never use downloaded cover images.

## Motion

Quiet, mechanical, satisfying: the stamp marks the ownership moment. Interface press/hover transitions last 150–250ms. Readable cards stay still; recent reflections use a static grid. `prefers-reduced-motion` disables movement.

Depth belongs to the artwork and books, not animated page decoration. Cards have modest warm shadows; book spines can lift on fine-pointer hover. Touch devices and reduced motion retain still poses. The reading-room shell, generous gutters, neutral category controls, and shop concepts use the same tokens and control hierarchy documented in `DESIGN.md`.

## Do / Don't

- **Do** keep the wordmark small; the reader's name is the loudest thing on the card.
- **Do** let paper grain (`/grain` overlay) sit over everything at low opacity.
- **Don't** add gradients, glassmorphism, drop-shadowed floating blobs, or emoji in UI copy.
- **Don't** introduce a fourth ink or a second accent color.
- **Don't** require an account for anything. The device remembers the name; the link carries the line.
