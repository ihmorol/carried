# Carried UI and artifact matrix

## Card fixtures

Use deterministic, local-only lines with book/date/name metadata. Never change production seed identities to make screenshots convenient.

For each Bookplate/Poster/Ticket and Paper/Midnight/Moss:
- Short Latin reflection and ordinary author/name.
- Maximum valid normalized 220-character Latin reflection and 24-character name.
- Short Bengali reflection with conjuncts/vowel signs: `ভয়কে নাম ধরে ডাকলে পথটা একটু সহজ হয়ে যায়।`
- Maximum valid Bengali reflection plus long title/author; respect the codec's JS-length limits.
- Mixed-script quote, book, author, and name independently.
- An unbroken word, combining marks, whitespace, and a legacy payload without `ct`.

Inspect real DOM, canvas PNG, and OG. Check quote bounds, credit grouping, metadata, ownership center/scale, no overlay/paint occlusion, and script shaping. Verify export dimensions and nonzero bytes as preliminary checks only.

## Responsive / interaction

| Surface | Checks |
|---|---|
| Home | one scroll, searchable covers, filters/history, earlier write CTA, jump links, 8-book initial shelf, honest cover fallback |
| Composer | compact native radios, chosen proof, required/over-limit errors, long paste retains text, preview failure does not destroy form |
| Shared line | full-width fit, save/copy/share fallback, readable provenance, restyle original remains unchanged, payload-only book works |
| My lines | local persistence, cross-tab state, search/sort, quota/read failure, correct empty state, skip target |
| Shop/cart | single selector before mobile catalogue, complete fitted artwork, source identity/date retained, local save feedback, no checkout |
| Navigation | keyboard Tab, skip to main, menu open/Escape/focus return, touch targets, 200% zoom |

## Faults

- Reject only writes to `carried.shelf.v1`, allowing reads. Verify warning survives synchronous subscriber reads.
- Reject storage reads. Verify no blind overwrite of an unseen shelf.
- Retry a local save. Verify no additional public POST.
- Deny clipboard/native-share or cancel sharing. Verify accurate recovery/cancellation behavior.
- Disconnect book storage while a valid URL-carried book still resolves from payload.
- Paste far over 220 characters; shorten to valid input without resetting the draft.

Restore all injected functions and settings. If restoration or evidence is uncertain, reload the isolated test page rather than using that state for another assertion.

## Skill exercise prompts

1. “Audit the revised card download at 375px. Check all three inks, not just Paper.”
2. “Can I publish this change? Tests pass, but verify PNG and Bengali link previews.”
3. “Verify that a storage-quota failure and long pasted draft recover without losing my line.”

Record the procedures actually exercised. Fresh-session triggering and real device sharing require their own explicit evidence.
