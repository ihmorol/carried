---
name: carried-visual-qa
description: Verify Carried's real UI, user journeys, responsive layouts, and DOM/PNG/OG card fidelity. Use before calling a Carried design or rendering change finished, when reviewing mobile behavior, or when testing a card export. Produce local evidence and distinguish observed failures from hypotheses.
---

# Carried visual QA

## Scope and safety

Read current brand/edition rules and the affected diff. Use `/browse` from gstack for browser work. Prefer an isolated local preview with `UPSTASH_REDIS_REST_URL=''`, `UPSTASH_REDIS_REST_TOKEN=''`, and `NEXT_TELEMETRY_DISABLED=1`. Do not post test content publicly, click external share destinations, change user storage, commit, or deploy without authorization.

Use an isolated test origin/browser state. Preserve existing user data. Name fault injections and restore them. Inspect existing targets before writing. Keep audit artifacts outside the repository unless the user requests a checked-in deliverable.

On this Windows installation the complete launcher is normally `~/.agents/skills/gstack/browse/dist/browse.exe`; check it rather than assuming the partial `.Codex` copy works. Browser output paths must be under the workspace or system temporary directory. Capture there, then copy evidence to a new project-scoped audit folder. This is an environment hint, not permission to install a second browser.

## Repeatable pass

1. Establish the branch, commit/diff, target URL, live/offline mode, and viewport. A dev compile delay is not a production metric.
2. Capture the affected UI before interaction. Wait for target content/fonts rather than calling an in-flight route screenshot a defect. For lazy covers, scroll them into view before judging a blank plate.
3. Walk the relevant journey as a reader with normal input, then an edge/error case. Use actual links, native inputs, and keyboard actions.
4. Capture the actual resulting artifact. A successful Save click and nonzero PNG bytes prove delivery, not correctness.
5. Run automated accessibility checks and manually inspect actual colors, font sizes, overflow, focus order, and readable content. An empty axe result does not override a visible contrast failure.
6. Reproduce each reported failure once. After a fix, revisit the exact case and adjacent routes.
7. Run `npm test`, `npm run lint`, and an isolated production build. Check the production preview as well as dev.
8. Report verified passes, remaining failures, source-only hypotheses, and limitations separately.

## Matrix

Read `references/matrix.md` for fixtures and required states. At minimum cover the 3 editions × 3 inks, short and maximum Latin/Bengali/mixed-script content, mobile 320/375/390, tablet 768, desktop 1280/1440, keyboard, reduced motion, and zoom.

The browser DOM and 4:5 PNG should agree in composition and line breaks. The 1200×630 OG is an approved landscape adaptation: judge complete text, script shaping, identity, clear layout, and correct ownership marks rather than demanding identical aspect-ratio pixels.

Do not accept text merely because it exists in DOM or a drawing call. Check what the reader can see: no off-canvas quote, obscured credits, tiny mis-scaled stamp, low-contrast ink, or wrong Bengali vowel placement.

## Capture actual exports

Use the normal Save action. If the headless browser cannot expose a native download, instrument `URL.createObjectURL` in the isolated page to retain the emitted Blob, then use `FileReader` and a later browser command to write the completed data URL. Some launcher versions return before asynchronous expressions resolve; confirm nonzero file size before inspection. Fetch only the same-origin OG path discovered from the page metadata.

For web UI acceptance, inspect browser screenshots directly. Do not use a document-only visual judge for web pages. If creating an independently requested PDF/presentation deliverable, follow that document skill's gate instead.

## Output

A useful finding is:

> **P1 · Mobile card clips.** At 375px the artwork extends to x=420. Reproduced on Ticket and Poster. Evidence: before.png. Expected: whole card and controls fit without horizontal scrolling. After fix: 375px page and card bounds verified, after.png.

End with:
- Exact commands/results and tested environment.
- Journey and matrix coverage; explicitly mark untested native sharing/live Redis/real devices.
- Local evidence links and before/after comparisons.
- `DONE`, `DONE_WITH_CONCERNS`, or `BLOCKED`, with the reason.

Do not turn a QA request into unsolicited code changes. If implementation is authorized, fix in focused units and repeat the same checks. Do not inflate quality claims or hide failing tests.
