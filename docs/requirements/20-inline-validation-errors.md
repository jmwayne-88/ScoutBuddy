# Requirement 20 — Inline Validation Errors (Replacing `?error=` Query Strings)

Status: Not started
Depends on: [Requirement 13](13-ux-quick-win-polish.md) (ADR 0023's redirect-based feedback mechanism, which this requirement partially supersedes for validation specifically)

## Goal

Replace the app's current validation-error pattern — redirect to the same (or a related) page with the problem encoded in a `?error=` query string, rendered as a page-level `Alert` — with field-level inline errors or a toast, so a failed submission doesn't require Next.js to re-navigate and doesn't leave a long-lived error message sitting in the URL bar.

## Source

Recommendation #14 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section. Explicitly flagged in that requirement's own text as a deferred item, not folded into its redirect-based toast work, because this one *removes* a query-string pattern rather than adding one.

## Problem

Three distinct validation failures today all funnel through the same `?error=` query-string convention, each rendered differently:

- `submitMenu` (`app/(app)/menus/[id]/actions.ts`): redirects to `/menus/${menuId}?error=empty-occasions`; the menu page renders a page-level `<Alert severity="error">` naming the problem in prose.
- `createPatrol` (`app/(app)/patrols/actions.ts`): on an invalid color, redirects to `/patrols/new?error=...&name=...&type=...&order=...` — re-encoding the *entire form's values* into the URL just to survive the redirect and re-populate the form.
- `updatePatrol` (same file): on an invalid color, redirects to `/patrols/${patrolId}?error=${encodeURIComponent(colorError)}`.

None of these is field-level — each surfaces as one generic alert at the top of the page, disconnected from the specific input that caused it, and each leaves the error (and, for `createPatrol`, the entire previous form state) sitting in the URL after being read, which looks wrong on refresh, share, or back-navigation.

## Requirements

- **REQ-20.1** `submitMenu`'s empty-occasion validation failure is reported without navigating away from the current page state — either as a toast (via Requirement 13's `withToast`, distinguished as an error-severity toast rather than the default info one) or, preferably, as inline text directly on the specific empty occasion's card (e.g. "This occasion needs at least one dish before you can submit"), not a single page-level `Alert` disconnected from the actual empty occasion(s).
- **REQ-20.2** `createPatrol`'s color-validation failure is reported as a field-level error directly on the color input in `components/PatrolColorField.tsx` (MUI `TextField`'s own `error`/`helperText` props), without redirecting at all and without re-encoding the rest of the form's values into the URL to survive a round trip — the form's own already-typed values simply remain in place because no navigation happened.
- **REQ-20.3** `updatePatrol`'s color-validation failure gets the same field-level treatment as REQ-20.2, on `/patrols/[id]`'s edit form.
- **REQ-20.4** Implementing REQ-20.2/20.3 without a full page navigation requires these two forms to adopt `useActionState` (or an equivalent client-side action-result mechanism) so the Server Action's validation result can flow back into the rendering form — a real architectural shift for these two specific forms (from "plain form, Server Component" to "form bound to client-tracked action state"), and must be documented in its own ADR per CLAUDE.md's rule, including why this is the first form in the app to make that shift.
- **REQ-20.5** No validation-error path in the app encodes unrelated form state into the URL as a workaround for losing it across a redirect, once this requirement ships — REQ-20.2's removal of `createPatrol`'s `name`/`type`/`order` query params is the specific case this closes, and it sets the expectation for any future validation error.
- **REQ-20.6** This requirement does not touch Requirement 13's `?toast=`/`?celebrate=` pattern for *success* feedback (ADR 0023) — only validation-failure paths are in scope here; a successful mutation still redirects with a toast exactly as Requirement 13 established.

## Acceptance Criteria

- [ ] Attempting to submit a menu with an empty active occasion shows the problem without a full page navigation and without a generic top-of-page alert disconnected from the specific occasion.
- [ ] Entering an invalid patrol color on either the new-patrol or edit-patrol form shows the error directly on the color field, with the rest of the form's typed values still present (because no navigation occurred).
- [ ] The URL never carries an `?error=` or re-encoded form-state query string after this requirement ships.
- [ ] A new ADR documents the `useActionState` adoption for the two patrol forms.
- [ ] Requirement 13's success-toast behavior (`?toast=`/`?celebrate=`) is unchanged by this work.

## Out of Scope for This Requirement

- Any change to what counts as a validation error, or to the underlying validation logic itself (`lib/validation.ts`, the color-contrast check in `app/(app)/patrols/actions.ts`).
- Converting every other plain-form page in the app to `useActionState` — only the three validation paths named above are in scope; the many other forms that never fail validation client-visibly (e.g. "Add dish," which has no failure mode beyond a required-field browser validation) are unaffected.
- Requirement 13's success-toast mechanism, which this requirement explicitly leaves alone (REQ-20.6).

## Related

- [Requirement 13 - UX Quick-Win Polish Pass](13-ux-quick-win-polish.md) / [ADR 0023](../adr/0023-redirect-based-toast-notifications.md) — the success-path pattern this requirement's validation-path changes sit alongside, not replace.
- [Requirement 5 - Workflow Hardening & Polish](05-workflow-hardening-and-polish.md) — REQ-5.6 is the empty-occasion submit guardrail whose error presentation this requirement changes.
- CLAUDE.md's "every architecture decision gets its own ADR" rule — governs REQ-20.4's `useActionState` adoption.
