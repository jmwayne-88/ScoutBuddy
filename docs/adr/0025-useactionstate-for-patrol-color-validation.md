# 0025. `useActionState` adopted for the two patrol color-validation forms

Date: 2026-10-18
Status: Accepted

## Context

[Requirement 20](../requirements/ux-interaction-polish/20-inline-validation-errors.md) replaces the app's `?error=` query-string convention for validation failures with inline, field-level feedback. Two of its three cases — `createPatrol` and `updatePatrol`'s color-contrast validation (REQ-20.2/20.3) — report the problem directly on `components/PatrolColorField.tsx`'s own color input, which requires the Server Action's validation result to flow back into the still-mounted form without a full page navigation. `submitMenu`'s empty-occasion case (REQ-20.1) doesn't need this mechanism — see "Alternatives Considered."

ADR 0023 considered `useActionState` for every mutating action in the app (for toast feedback) and rejected it as too invasive a conversion for too little benefit. This decision is narrower: only these two forms, only for their one validation path, and the benefit — avoiding a navigation and the query-string re-encoding of the entire form described in Requirement 20's Problem section — is specific to them.

## Decision

`createPatrol` and `updatePatrol` (`app/(app)/patrols/actions.ts`) change signature from `(formData: FormData) => Promise<void>` to `(prevState: PatrolFormState, formData: FormData) => Promise<PatrolFormState>`, where `PatrolFormState = { error: string | null }`. On the color-contrast validation failure, each now `return`s `{ error: colorError }` instead of redirecting with the error (and, for `createPatrol`, the rest of the form's fields) encoded into the URL. Every other failure path (permission checks, the icon-id check) is unchanged — it still throws, which is out of this requirement's scope.

Both forms move from a plain `<form action={serverAction}>` built directly in a Server Component page (`app/(app)/patrols/new/page.tsx`, `app/(app)/patrols/[id]/page.tsx`) into a new `"use client"` wrapper (`components/CreatePatrolForm.tsx`, `components/EditPatrolForm.tsx`) that calls `useActionState` and renders `<form action={formAction}>`. The pages themselves stay Server Components — they fetch the patrol row (for the edit case) and pass it as a plain data prop into the new wrapper, the same server-data-into-client-component shape already used throughout the app (e.g. `components/CampoutCard.tsx`), not the "pass a JSX element across the boundary" shape CLAUDE.md's MUI gotcha note warns against.

`PatrolColorField` gains an optional `error?: string | null` prop, surfaced as a `FormHelperText` (error-colored) beneath the color swatch — there is no MUI `TextField` to attach `error`/`helperText` to directly, since the color input is a native `<input type="color">`, but this is the same themed error-text treatment `TextField` itself uses.

## Alternatives Considered

- **Extending `withToast`'s redirect pattern with an error-severity toast** (REQ-20.1's non-preferred option): would have kept both forms as plain Server Components, no ADR needed. Rejected for the color fields specifically because a toast is disconnected from the color input itself, and `createPatrol`'s existing behavior of re-encoding `name`/`type`/`order` into the redirect URL just to survive the round trip is exactly what REQ-20.5 says to stop doing — a toast still requires *some* redirect, which still requires either losing the form's state or re-encoding it.
- **`submitMenu`'s empty-occasion case also adopting `useActionState`**: not needed — the "occasion has no dishes" fact is already present in the page's own query result on every render, so the menu page (`app/(app)/menus/[id]/page.tsx`) shows the inline per-occasion message and disables the Submit button unconditionally from existing data, with no form-state round trip at all. `submitMenu` keeps its plain `FormData` signature and now just no-ops back to the same URL (no `?error=`) as a server-side backstop against a request that bypasses the disabled button.
- **One shared `PatrolForm` component for both create and edit**: considered, but the two pages differ enough around the form (the edit page's danger zone, reactivation/assignment prompts; the new page's lack of any of that) that a single component would need a `mode` prop and conditional rendering for state that genuinely differs per page. Two small, nearly-identical components were clearer than one branching one.

## Consequences

- `createPatrol` and `updatePatrol` can no longer be wired to a plain `<form action={...}>` in a Server Component — any future change to these two actions' call sites must go through their respective client wrapper.
- The two patrol pages (`app/(app)/patrols/new/page.tsx`, `app/(app)/patrols/[id]/page.tsx`) no longer read or forward an `error` (or, for `new`, `name`/`type`/`order`) search param — removed per REQ-20.5.
- This is the first form-level `useActionState` usage in the app; the next person adding inline validation to a different form now has a concrete pattern to follow (or to deliberately diverge from, per the per-case reasoning above) rather than defaulting to ADR 0023's redirect-and-query-param pattern for every validation case.

## Related

- [Requirement 20 - Inline Validation Errors](../requirements/ux-interaction-polish/20-inline-validation-errors.md) — REQ-20.2/20.3/20.4, the requirement this ADR exists to satisfy.
- [ADR 0023 - Toast feedback delivered via a post-redirect query param](0023-redirect-based-toast-notifications.md) — the success-path pattern this ADR's validation-path change sits alongside; 0023's rejection of `useActionState` as an app-wide mechanism still stands, this ADR only carves out these two specific forms.
- CLAUDE.md's "MUI + Server Components gotcha" note — why the new wrapper components take plain data props from their Server Component pages rather than receiving JSX built server-side.
