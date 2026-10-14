# Requirement 10 — Per-Campout Patrol Roster (Add/Remove)

Status: Not started — documentation only
Depends on: [Requirement 1 - Core Approval Loop](01-core-approval-loop.md) (the existing per-patrol assign form this reuses), [Requirement 8 - Manage Patrols](08-manage-patrols.md) (patrols are admin-managed rows now, and this follows the same confirm-before-destroying pattern established there)

## Goal

Let the ASPL of Camping remove a patrol from one specific campout — unassigning it without touching the patrol itself or its menus on any other campout — and add an existing patrol to a campout it isn't currently on. This is scoped to a single (campout, patrol) pairing, distinct from Requirement 8's "delete patrol" (which is global and removes a patrol everywhere).

## Context: half of this already exists

Every campout's detail page already shows **every** active patrol (plus any inactive one with existing history there — Requirement 8), and each one's slot is already either a "View menu" link (if assigned) or an inline "Assign menu" form (if not). That means **adding** a patrol that isn't yet on a campout is already fully functional today, via the existing `assignMenu` action from Requirement 1 — there's no new UI to build for that half.

What's actually missing is **removing** a patrol from a campout once it has a menu there — no such action exists anywhere today. This requirement is really about adding that one capability, and then confirming (not re-building) that the existing assign form correctly reappears once a patrol's been removed.

## Requirements

- **REQ-10.1** On a campout's detail page, a patrol that currently has a menu for that campout shows a "Remove from campout" control, in addition to its existing "View menu" link.
- **REQ-10.2** Removing a patrol from a campout permanently deletes that one menu and everything under it (meals, dishes, ingredients, reviews) — scoped to this campout only. The patrol itself, its other menus on other campouts, and its meal-framework exceptions for this campout (Requirement 4 — so a previously-configured occasion removal isn't lost if the patrol is re-added later) are all untouched.
- **REQ-10.3** Before the deletion happens, the ASPL sees an explicit confirmation stating what will be lost (dish count, and whether the menu is Approved) — the same confirm-before-destroying pattern established for deleting a patrol entirely in Requirement 8, not a single easily-misclicked button.
- **REQ-10.4** Immediately after removal, that patrol's slot on the campout reverts to the normal "Assign menu" form — the same one every not-yet-assigned patrol already shows. No new "add" UI is required; this just needs to keep working the way it already does today.
- **REQ-10.5** Adding a patrol to a campout it isn't currently on continues to work via the existing per-patrol assign form (Requirement 1) — called out explicitly here as this requirement's "add" half, confirmed rather than rebuilt.
- **REQ-10.6** Re-assigning a previously-removed patrol to the same campout creates a fresh, empty menu whose active occasions still correctly respect any meal-framework exceptions already configured for that campout (Requirement 4) — removing and re-adding a patrol doesn't reset that configuration.

## Decision assumed (flag if this isn't what you want)

Removal is allowed at **any** menu status, including Approved — consistent with Requirement 8's own precedent that deleting a patrol entirely is allowed even with Approved menus, provided the warning is clear. REQ-10.3's confirmation is what prevents this from being an accident; there's no separate "block if Approved" rule layered on top. If you'd rather Approved menus be protected from per-campout removal (even though whole-patrol deletion already isn't), say so and this gets revised.

## Acceptance Criteria

- [ ] A patrol with an assigned menu on a campout shows a working "Remove from campout" control.
- [ ] Clicking it requires an explicit confirmation naming the dish count and Approved status before anything is deleted — not a single ambient click.
- [ ] After confirming, that one menu (and its meals/dishes/ingredients/reviews) is gone; the same patrol's menus on other campouts are untouched; the patrol itself still exists and is unaffected in Manage Patrols.
- [ ] The removed patrol's slot on that campout immediately shows the normal "Assign menu" form again.
- [ ] Re-assigning a previously-removed patrol to the same campout respects any meal-framework exceptions already configured for that campout — removed occasions stay removed.
- [ ] A patrol not currently on a campout can still be added via the existing assign form (regression check, not new behavior).

## Out of Scope for This Requirement

- Any change to Requirement 8's "delete patrol entirely" behavior — that remains global and separate from this campout-scoped removal.
- Bulk remove/add across multiple campouts at once — this is a single-campout, single-patrol action, same granularity as the existing assign form.
- Undo — removal is immediate and permanent once confirmed, same as every other destructive action in the app so far (no soft-delete/trash concept exists anywhere).

## Related

- [Requirement 1 - Core Approval Loop](01-core-approval-loop.md) — the existing `assignMenu` action this requirement's "add" half already relies on.
- [Requirement 4 - Meal-Framework Variation](04-meal-framework-variation.md) — meal-framework exceptions are campout+patrol scoped and explicitly preserved across a remove/re-add cycle (REQ-10.2/10.6).
- [Requirement 8 - Manage Patrols](08-manage-patrols.md) — the cascading-delete-behind-a-confirmation-dialog pattern this requirement reuses at a smaller (single-menu) scope; `components/DeletePatrolDialog.tsx` is the direct precedent for whatever confirmation UI this builds.
- This is a straightforward feature extension of already-established patterns (manual cascade delete per ADR 0012/0018, confirm-before-destroy per Requirement 8) — it isn't expected to need its own ADR when built, unlike Requirement 8.
