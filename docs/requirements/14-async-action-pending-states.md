# Requirement 14 — Async Action Pending States

Status: Not started
Depends on: none tied to a single ROADMAP iteration (cross-cutting, like Requirements 6+); complements [Requirement 13](13-ux-quick-win-polish.md)'s toast feedback

## Goal

Give every Server-Action-backed control a visible pending state between the moment it's clicked and the moment its result (a toast, a re-render, a redirect) lands, so a slow connection or a Neon cold start never looks like a dead button — and so a double-click can't fire the same mutation twice.

## Source

Recommendation #2 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section — rated a quick win in cost but deliberately held out of that pass because it touches the button/form layer of nearly every page at once, better reviewed as its own change than folded into Requirement 13's already-large diff.

## Requirements

- **REQ-14.1** Every submit control backed by a Server Action — including, at minimum, Add dish, Add ingredient, Save notes, Submit menu, Approve, Request changes, Add patrol (campout assignment), Remove dish/ingredient, Rename/Save and Edit/Save inside dialogs, Delete patrol, Remove from campout, Create campout, Create/update patrol, and the patrol reorder/activate controls — visibly reflects a pending state between click and the next render: disabled, with either a spinner (MUI `CircularProgress`) alongside its label or a label change (e.g. "Adding…").
- **REQ-14.2** For a plain `<form action={serverAction}>` rendered directly inside a Server Component (the majority of this app's forms — the Server Component itself has no pending state to hold), the pending treatment is implemented with React's `useFormStatus` hook inside a small reusable submit-button component, not by converting the surrounding form into a client component.
- **REQ-14.3** One reusable component (e.g. `components/SubmitButton.tsx`) wraps `useFormStatus` and is used everywhere REQ-14.1 applies, rather than each call site re-implementing its own pending UI — the same "one shared mechanism" posture `components/ToastListener.tsx` already established for Requirement 13's toasts.
- **REQ-14.4** A dialog's own submit button (`RenameDishDialog`, `EditIngredientDialog`, `DeletePatrolDialog`, `AddPatrolToCampoutDialog`, `RemoveFromCampoutDialog`) gets the same pending treatment. Since these are already client components with their own `action={async (formData) => {...}}` wrapper, this may use `useFormStatus` or the dialog's own `useTransition`, whichever fits — but the existing `try { await action(formData); } finally { setOpen(false); }` pattern from Requirement 13's REQ-13.1 fix is not changed by this work.
- **REQ-14.5** A pending control cannot be activated a second time while its first submission is still in flight — this is the primary correctness motivation for this requirement, not purely cosmetic: it prevents a double-click from creating two dishes, two ingredients, or two patrol assignments from one mutation.
- **REQ-14.6** The pending treatment respects the theme's existing 44px minimum touch target (`lib/theme/theme.ts`'s `MuiButton` override) — swapping in a spinner must not shrink the button's visible or clickable area below that minimum.
- **REQ-14.7** `components/RoleSwitcher.tsx`'s existing `useTransition`/`isPending`-driven disabling of the role `Select` while a role change is in flight is left as-is and treated as this requirement's reference behavior, not reinvented.

## Acceptance Criteria

- [ ] Clicking any Server-Action-backed submit button immediately disables it and shows a pending indicator, before the resulting toast or page update lands.
- [ ] Rapidly double-clicking a submit button (e.g. "Add dish") results in exactly one mutation, not two.
- [ ] Every pending button remains at least 44×44px.
- [ ] `RenameDishDialog`'s and `EditIngredientDialog`'s Save buttons show the pending treatment and still close their dialog correctly afterward.

## Out of Scope for This Requirement

- Optimistic UI (showing the new dish/ingredient before the server confirms it) — this requirement is about an honest pending state, not predictive rendering.
- Skeleton loading for a page's initial data fetch — see the separate loading-skeletons requirement.
- Any change to what a Server Action does once it runs, or to Requirement 13's toast/redirect mechanism itself.

## Related

- [Requirement 13 - UX Quick-Win Polish Pass](13-ux-quick-win-polish.md) — this requirement is the "during" half of the feedback loop Requirement 13's toasts complete as the "after" half.
- CLAUDE.md's Design System section — the 44px minimum touch target this requirement must preserve.
