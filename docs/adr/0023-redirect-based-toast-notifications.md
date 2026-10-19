# 0023. Toast feedback delivered via a post-redirect query param

Date: 2026-10-16
Status: Accepted

## Context

[Requirement 13](../requirements/ux-interaction-polish/13-ux-quick-win-polish.md) calls for every mutating Server Action to surface a brief confirmation (REQ-13.1/13.2) instead of relying on a silent `revalidatePath` re-render as the only feedback. Almost every mutation in the app is wired up as a plain `<form action={serverAction}>` built directly in a Server Component (`app/(app)/menus/[id]/page.tsx`, `app/(app)/campouts/[id]/page.tsx`, `app/(app)/patrols/page.tsx`, and the handful of dialog components) — there is no client-side state anywhere that could receive a return value from most of these actions, short of rewriting every form into a client-wrapped component the way `components/RenameDishDialog.tsx` already does for its own, narrower reason (closing itself after submit).

## Decision

Every mutating Server Action that should show a toast ends by calling `redirect()` to its own destination with a `?toast=<message>` (and optional `&celebrate=1`) query param appended, built through one shared helper, `lib/toast.ts`'s `withToast()`. A single client component, `components/ToastListener.tsx`, is mounted once in `app/(app)/layout.tsx`. It reads `toast`/`celebrate` via `useSearchParams()`, shows an MUI `Snackbar`/`Alert`, and then calls `router.replace()` to strip those two params back out — so a refresh or back-navigation never re-shows or re-fires the same toast.

This reuses a pattern already present in the codebase before this requirement: `submitMenu`'s empty-occasion validation already redirected to `?error=empty-occasions`, and several patrol-management actions already redirected on success (`assignMenu`, `createCampout`, `createPatrol`, `deletePatrol`, etc.). Requirement 13 extends that same shape to the one-off CRUD actions (add/rename/remove dish, add/edit/remove ingredient, update notes, remove/restore meal occasion, remove patrol from campout, move patrol, set patrol active) that previously only called `revalidatePath` and stayed in place.

One consequence had to be handled directly: two dialogs (`RenameDishDialog`, `EditIngredientDialog`) already awaited their action call and then called `setOpen(false)` to close themselves. `redirect()` throws a control-flow exception on the success path now, which would skip that `setOpen(false)` line and could leave the dialog visually stuck open. Both were changed to call `setOpen(false)` from a `finally` block instead, which runs whether or not the action throws — confirmed correct by running the app and watching both dialogs close after a save.

## Alternatives Considered

- **`useActionState` / client-wrapped forms everywhere**: the standard React/Next pattern for an action to hand data back to the component that called it. Rejected as the primary mechanism because it would require converting roughly twenty plain Server-Component forms into client components for no reason other than displaying a toast, a much larger and more invasive change than Requirement 13's "quick win" scope intends, and a real regression-risk multiplier across the whole app in one pass.
- **A cookie-based flash message** (set a cookie in the action, read and clear it in the layout): avoids putting the message in the URL, but Server Actions can only set cookies, not read-then-clear them in the same request in a way that reliably avoids a message reappearing on the next unrelated navigation; the query-param approach's "redirect to a clean URL" step already solves that problem for free via the browser history entry it replaces.
- **A global client-side store (e.g. a toast context with a dispatch function passed down)**: works naturally from the dialog components (which are already client components) but not from the plain `<form action={serverAction}>` cases, which have no client code to call a dispatch function from at all — would still need the redirect+query-param mechanism for most actions anyway, making a second mechanism for the dialogs pure duplication.

## Consequences

- New mutating actions get toast feedback by adding one `redirect(withToast(path, message))` call at the end — no new component, no new wiring, consistent with how the existing `?error=` pattern already works in this codebase.
- The destination URL momentarily carries `?toast=...` (and clears itself within one client-side `router.replace`); this is a visible, if brief, URL change — acceptable here since the app already does this for `?error=` and `?prompt=`.
- Any Server Action that needs this must call `redirect()`, which means it can no longer `return` a value to a caller that reads it — not a real constraint today, since nothing currently reads a return value from these actions.
- A dialog that awaits its own action and expects to close itself afterward must use `try/finally` (see `RenameDishDialog.tsx`, `EditIngredientDialog.tsx`) rather than a bare `await action(); setOpen(false);` once that action redirects — a real, confirmed-by-running trap for anyone adding a new such dialog in the future.

## Related

- [Requirement 13 - UX Quick-Win Polish Pass](../requirements/ux-interaction-polish/13-ux-quick-win-polish.md) — REQ-13.1-13.5.
- [ADR 0009 - Next.js Server Actions for writes, Server Components for reads](0009-server-actions-for-writes.md) — this ADR's redirect-based pattern operates within that same writes-via-Server-Actions architecture.
- [ADR 0017 - Adopt MUI design system](0017-adopt-mui-design-system.md) — `ToastListener` is built on MUI's `Snackbar`/`Alert`, consistent with "MUI is the only component library."
