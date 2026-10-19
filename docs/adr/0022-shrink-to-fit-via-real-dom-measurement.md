# 0022. Shrink-to-fit via real DOM measurement, replacing the row-count heuristic

Date: 2026-10-15
Status: Accepted. Supersedes the font-sizing portion of [ADR 0020](0020-print-view-route-group-and-pagination.md) — that ADR's route-group and padding-as-margin decisions are unchanged.

## Context

[ADR 0020](0020-print-view-route-group-and-pagination.md) shipped a deterministic row-count heuristic (`lib/print-layout.ts`'s `pickFontSize`/`pickShoppingListFontSize`) to shrink print text toward fitting the menu on 2 pages and the shopping list on 1, explicitly rejecting real DOM measurement in its own Alternatives Considered as "disproportionate." The user asked directly afterward: can this use the same scale-to-fit logic Microsoft Word does? Word's "Shrink to Fit" doesn't guess from a row count — it renders, measures the actual page overflow, and steps the font size down until it genuinely fits. That's a fair challenge to the earlier call: the heuristic was always an approximation standing in for something a browser can actually do correctly, given one new allowance the earlier ADR didn't have reason to consider — a Client Component measuring real layout, rather than everything on this page staying server-rendered.

## Decision

**Replace both heuristic functions with `components/ShrinkToFitPage.tsx`, a Client Component that measures actual rendered height and shrinks font size until it fits — the same algorithm Word uses.** It renders at a starting size (12pt), reads the content wrapper's real `scrollHeight` against the page box's real available height (its `clientHeight` minus its own padding, read via `getComputedStyle` — not a hardcoded constant, so it stays correct if the page geometry in `print.module.css` ever changes), and steps the font size down in 0.5pt increments until it fits or hits the 8pt floor. `useLayoutEffect` (not `useEffect`) runs this before the browser paints, so the un-shrunk size is never actually visible.

**The decision/comparison logic is extracted into a pure function, `lib/shrink-to-fit.ts`'s `computeShrinkToFitSize`**, taking a `measureHeightAtSize` callback instead of touching the DOM directly. This is the one part of the new behavior that can actually be verified in this environment: unit tests drive it with a mocked height function and assert the stepping/floor behavior, the same way `pickFontSize`'s old thresholds were tested. The DOM-measurement glue itself (the refs, `useLayoutEffect`, real `scrollHeight`/`clientHeight` reads) has no automated verification here — there is no browser available in this build environment, only a Node-based dev server queried with `curl`, which cannot execute client-side JavaScript or measure real layout. The server-rendered HTML and the absence of hydration/console errors in the dev server's own log were checked; the actual shrinking behavior in a real browser was not, and should be spot-checked manually.

**Both print pages now use the same mechanism**, not just the shopping list the user asked about directly — page 1's "fits on page 1" requirement (REQ-12.2/12.8) is exactly the same kind of problem, and leaving it on the weaker heuristic while page 2 got real measurement would have been a strictly worse, inconsistent outcome for no real benefit.

**This also fixed a latent bug**: page 1's old layout wrapped its meal list in `sx={{ flex: 1, overflow: "hidden" }}` to visually clip within the heuristic's guessed height — an inline `overflow: hidden` not gated by `@media print`, meaning that if the heuristic ever under-shot, the *printed* output could have silently clipped real content even though `print.module.css`'s outer `.printPage` correctly switched to `overflow: visible` for print. Real measurement removes the need for that inner clipping scaffolding entirely, since the whole point is knowing accurately whether content fits — it was deleted along with the heuristic.

## Alternatives Considered

- **Keep the row-count heuristic, just tune its thresholds further**: this was the original plan's fallback position, but it's still fundamentally a guess — no amount of threshold-tuning makes an estimate as correct as actually measuring, and the user's framing ("the same logic Word does") was asking for correctness, not a better guess.
- **A server-side headless-browser render pass to measure before serving HTML**: would give real measurement without a Client Component, but requires a headless browser dependency this app has never needed (ADR 0001/0002's "no background job infrastructure" framing) — disproportionate for what a client-side layout effect already does for free.

## Consequences

- `lib/print-layout.ts` and its tests are deleted — nothing else referenced them.
- This is the first Client Component on the print page whose job is reading real layout (as opposed to `PrintButton`'s simple `onClick`) — a precedent for any future "make this fit" print work, rather than another row-count guess.
- Genuinely unverified in this build environment: whether the real shrink behavior looks right in an actual browser, across actual content volumes. This should be checked by hand (open the print preview for a dense real menu, confirm it visually shrinks and still looks legible) before trusting it fully.

## Related

- [Requirement 12 - Menu Print Preview & Shopping List](../requirements/printing-exports/12-menu-print-preview.md)
- [ADR 0020 - Print view route group and pagination](0020-print-view-route-group-and-pagination.md) — route groups and padding-as-margin are unchanged; only the font-sizing mechanism described there is superseded.
