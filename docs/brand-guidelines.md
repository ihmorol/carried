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
| `ink-faint` | `#9c917f` | metadata, placeholders |
| `rule` | `#d8cdb6` | hairlines, double-rule card borders |
| `stamp` | `#b23c25` | **the only accent**, stamps, key CTAs, focus rings |

Rules: stamp red is scarce, if everything is stamped, nothing is. Buttons are
ink-on-paper; red is reserved for the ownership moment and small emphasis.
The table above is the site UI, and it does not grow.

Cards are different: they carry one of the curated inks in `lib/inks.ts`,
five flat colors each (background, text, soft text, hairline, stamp). Each card
has exactly one accent, its stamp color, and nothing else on the card competes
with it. Inks are never re-derived or tweaked in a component; text must read at
7:1 against the card, soft text and the stamp at 3:1.

## Type

- **Fraunces** (500/600 + italic), headlines, the line itself, book titles, the name in the stamp. Serif is the voice of the book.
- **IBM Plex Mono** (400–600), everything else: UI, metadata, buttons, labels. Letter-spaced uppercase for ledger labels (`CARRIED OUT OF`, `No. 4F2A1C`).
- No third family in the UI. Body text is mono at 12–14px with generous leading, the site is text-light by design.
- **Card faces**: on a card, the line and the signature may be set in one of the curated faces in `lib/card-fonts.ts` (Fraunces by default). Ledger labels on the card stay in Plex Mono, and Bangla lines always use Noto Serif Bengali. A card face never leaks into the UI.

## Signature elements

1. **The stamp**, "CARRIED BY ⟨name⟩ ⟨date⟩", slightly crooked (-6.5°), ink-textured, always vermilion. It's the ownership moment; it never appears without a name.
2. **The double rule**, the default card frame, an inner border like a filed catalog card. Frame patterns (deco, ornate, letterpress and the like) take its place; they never stack with it.
3. **The accession number**, `No. XXXXXX`, minted from the line, on every card.
4. **The spine**, books are drawn as book-cloth spines with a head/foot band and edge lighting; never use downloaded cover images.

## Card collections

Five collections group inks, patterns and faces that belong together
(`lib/card-style.ts`). A collection is a starting point, not a cage.

- **Library**, the original catalog card: warm paper, the double rule, a library stamp.
- **Modern**, clean stock and bright accents, a notebook grid or a painted edge.
- **Retro**, the seventies paperback: sunbursts, ticket stripes, fat type.
- **Vintage**, old-world printing: flourishes, deco frames, foxed paper.
- **Keepsake**, inspired by fine stationery: cotton stock, letterpress plates, foil and botanicals.

Every pattern is flat line and fill, drawn once in `lib/card-art.ts` and painted the same on screen, in the saved PNG and in link previews.

## Motion

Quiet, mechanical, satisfying: the stamp thumps in (scale 1.7 → overshoot → rest, 550ms), sections rise 14px on load, the marquee drifts slowly and pauses on hover. `prefers-reduced-motion` disables all of it. Nothing bounces for fun.

Depth works the same way. Cards toss with a small hand-laid lean and straighten when a reader reaches for them, the hero pile drifts a few pixels with the pointer and settles when it lets go, books stand slightly off square and pull off the shelf on approach. The slow idle drift belongs to the hero's background ghosts only, under fine pointers; the card being read never bounces on its own. Touch devices and `prefers-reduced-motion` get the still poses.

## Do / Don't

- **Do** keep the wordmark small; the reader's name is the loudest thing on the card.
- **Do** let paper grain (`/grain` overlay) sit over everything at low opacity.
- **Don't** add gradients, glassmorphism, drop-shadowed floating blobs, or emoji in UI copy. That holds on cards and patterns too.
- **Don't** give a card a second accent color, or the UI a third typeface.
- **Don't** add an ink, face or pattern anywhere but its lib module (`lib/inks.ts`, `lib/card-fonts.ts`, `lib/card-art.ts`), placed in a collection and covered by the tests.
- **Don't** require an account for anything. The device remembers the name; the link carries the line.
