# Requirement 15 — Consistent Destructive-Action Pattern

Status: Implemented
Depends on: [Requirement 13](13-ux-quick-win-polish.md)'s toast mechanism (`lib/toast.ts`, `components/ToastListener.tsx`)

## Goal

Replace the app's one-size-fits-all approach to "deleting something" — currently either a full confirm dialog or no confirmation at all, with no rule for which a given action gets — with one deliberate, two-tier pattern: an **undo toast** for a cheap, easily-recreated change, and a **confirm dialog** reserved for real, hard-to-undo data loss.

## Source

Recommendation #6 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section.

## Problem

Today the app has two different destructive-action behaviors with no stated rule for which applies where:

- **Confirm dialog, naming what's destroyed**: `components/DeletePatrolDialog.tsx` (deleting a patrol — cascades to all its menus), `components/RemoveFromCampoutDialog.tsx` (removing a patrol's menu from one campout — cascades to its dishes/ingredients/reviews).
- **No confirmation at all, fires immediately**: "Remove dish" (`removeDish` in `app/(app)/menus/[id]/actions.ts`), "Remove" on an ingredient (`removeIngredient`), "Remove" on a meal-framework exception's restore-vs-remove pair (`removeOccasion`/`restoreOccasion` in `app/(app)/campouts/[id]/actions.ts`).

A single dish with several ingredients can represent real typing effort, and "Remove dish" currently destroys it with one accidental tap and no way back — while "Remove from campout," which is arguably *more* recoverable (the patrol can simply be re-added, per `app/(app)/patrols/[id]/page.tsx`'s `ReactivateCampoutsDialog` precedent), gets a full modal in the way every time.

## Requirements

- **REQ-15.1** Every destructive action in the app is classified into exactly one of two tiers, and that classification is documented in this requirement (not left to each component's own judgment):
  - **Tier 1 — confirm dialog** (data loss that is expensive or impossible to recreate by hand): delete a patrol, remove a patrol's menu from a campout.
  - **Tier 2 — undo toast** (data loss that's a few taps to redo): remove a dish, remove an ingredient, remove a meal-framework occasion exception.
- **REQ-15.2** A Tier 2 action still executes immediately on click (no modal interrupts the flow), but its confirmation toast (per Requirement 13's `withToast`) includes an **Undo** action embedded in the Snackbar, which — if pressed within the toast's visible duration — re-creates exactly what was removed.
- **REQ-15.3** Undo is implemented as a real, server-verified reversal (a new Server Action that re-inserts the specific removed row with its original field values passed through the undo request), not a client-only "put the DOM element back" illusion — so an undo still works correctly if the user has navigated or another tab has changed data in the meantime (in which case it fails gracefully with its own toast, e.g. "Couldn't undo — try re-adding it").
- **REQ-15.4** `components/ToastListener.tsx` gains an optional action slot (an `undo` query-param payload or an equivalent mechanism) so a Tier 2 toast can carry both its message and a button that posts to the corresponding undo action — a generalization of, not a replacement for, Requirement 13's existing toast mechanism.
- **REQ-15.5** Tier 1 actions are unchanged by this requirement — they keep their existing `DeletePatrolDialog`/`RemoveFromCampoutDialog` confirm-dialog treatment, now joined by a success toast (per Requirement 13) once the confirmed deletion completes, but no undo offer (an undo for a cascading multi-row delete is out of scope — REQ-15.1 is precisely what keeps that case in the confirm-dialog tier instead).
- **REQ-15.6** No destructive action in the app may execute with neither a confirm dialog nor an undo offer once this requirement ships — every current no-confirmation-and-no-undo action (`removeDish`, `removeIngredient`, `removeOccasion`) is upgraded to Tier 2, not left as-is.

## Acceptance Criteria

- [ ] Removing a dish or ingredient executes immediately and shows an Undo toast; pressing Undo within its visible window restores the exact dish/ingredient, including its ingredients' quantities if a dish-with-ingredients was removed.
- [ ] Removing a meal-framework occasion exception shows the same Undo toast treatment.
- [ ] Deleting a patrol or removing a patrol from a campout still requires the existing confirm dialog, unchanged, and shows a (non-undoable) success toast afterward.
- [ ] No action anywhere in the app destroys data with neither a confirmation step nor an undo offer.
- [ ] An expired/failed undo attempt shows a clear failure toast rather than silently doing nothing.

## Out of Scope for This Requirement

- Undo for a Tier 1 (cascading) delete — explicitly excluded by design; those stay confirm-dialog-gated instead.
- A general "activity log" or "trash" of everything ever removed — undo only covers the single most recent removal via its own toast, not a persistent history.
- Any change to what counts as a destructive action, or to the underlying cascade-delete logic in `app/(app)/patrols/actions.ts` / `app/(app)/campouts/[id]/actions.ts`.

## Related

- [Requirement 13 - UX Quick-Win Polish Pass](13-ux-quick-win-polish.md) — this requirement extends `components/ToastListener.tsx` rather than replacing it.
- [ADR 0023 - Toast feedback delivered via a post-redirect query param](../adr/0023-redirect-based-toast-notifications.md) — the undo action slot (REQ-15.4) is a structured extension of that same mechanism and should be documented as a follow-up to that ADR (or a new ADR superseding it) once implemented.
