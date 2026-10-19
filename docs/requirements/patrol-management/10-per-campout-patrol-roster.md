# Requirement 10 — Per-Campout Patrol Roster (Add/Remove)

Status: Not started — documentation only
Depends on: [Requirement 1 - Core Approval Loop](../roadmap-iterations/01-core-approval-loop.md) (the `assignMenu` action this reuses), [Requirement 7 - Campout Dashboard Layout](../ux-interaction-polish/07-campout-dashboard-layout.md) and [Requirement 8 - Manage Patrols](08-manage-patrols.md) (this requirement revises the "every active patrol gets a row" display model those introduced, now that the patrol roster is unbounded, and reuses Requirement 8's confirm-before-destroying pattern)

## Goal

Let the ASPL of Camping remove a patrol from one specific campout — unassigning it without touching the patrol itself or its menus on any other campout — and add an existing patrol to a campout it isn't currently on, through a single explicit control rather than a permanently-visible row per unassigned patrol. This is scoped to a single (campout, patrol) pairing, distinct from Requirement 8's "delete patrol" (which is global and removes a patrol everywhere).

## Context: half of this already exists, but the display model needs to change

Every campout's detail page currently shows **every** active patrol as its own row (plus any inactive one with existing history there — Requirement 8), each one's slot already either a "View menu" link (if assigned) or an inline "Assign menu" form (if not). That made sense when patrols were a fixed handful, but Requirement 8 made the patrol roster admin-managed and unbounded — a troop with a dozen youth and adult patrols would turn every campout page into a long list of mostly-irrelevant "Assign menu" rows for patrols that were never going to be on that particular campout.

**Revision for this requirement**: the campout detail page shows only the patrols that currently have a menu on that campout (as it already does for the "assigned" case), and adding a patrol becomes one distinct, explicit **"Add patrol"** control — a button opening a picker over the active patrols not yet on this campout — rather than a row-per-patrol with an inline form for every unassigned one. This replaces REQ-7.12/REQ-8's "show every active patrol a row regardless of assignment" model specifically for this page.

In practice, that "Add patrol" control is really only needed in two situations:

1. A patrol was removed from this campout (this requirement's own REQ-10.1/10.2) and needs to be re-added.
2. A new patrol was created (Requirement 8) but wasn't auto-added here — either the admin said "no" to the future-campouts prompt, or this campout was in the past at the time and was correctly skipped by that automatic assignment.

**Removing** a patrol from a campout once it has a menu there is still the one genuinely new capability — no such action exists anywhere today.

## Requirements

- **REQ-10.1** On a campout's detail page, a patrol that currently has a menu for that campout shows a "Remove from campout" control, in addition to its existing "View menu" link.
- **REQ-10.2** Removing a patrol from a campout permanently deletes that one menu and everything under it (meals, dishes, ingredients, reviews) — scoped to this campout only. The patrol itself, its other menus on other campouts, and its meal-framework exceptions for this campout (Requirement 4 — so a previously-configured occasion removal isn't lost if the patrol is re-added later) are all untouched.
- **REQ-10.3** Before the deletion happens, the ASPL sees an explicit confirmation stating what will be lost (dish count, and whether the menu is Approved) — the same confirm-before-destroying pattern established for deleting a patrol entirely in Requirement 8, not a single easily-misclicked button.
- **REQ-10.4** Immediately after removal, that patrol's card disappears from the campout's patrol list (it no longer has a menu there) and becomes available again as a choice in the "Add patrol" picker (REQ-10.5).
- **REQ-10.5** A single "Add patrol" control on the campout detail page opens a picker listing active patrols not currently on that campout; picking one and a due date assigns it, reusing the existing `assignMenu` action (Requirement 1) underneath. After assigning, the ASPL lands back on the campout's own detail page (not inside the newly-created menu) — they were managing the campout's roster, not about to start building that patrol's menu themselves. This revises `assignMenu`'s original redirect target, which only ever made sense for the row-per-patrol inline form this requirement already replaced.
- **REQ-10.6** The "Add patrol" control is disabled (or hidden — implementation's call) whenever every active patrol already has a menu on that campout, since there's nothing left to add. This is the normal state for most campouts most of the time, not an edge case to treat as broken.
- **REQ-10.7** Re-assigning a previously-removed patrol to the same campout creates a fresh, empty menu whose active occasions still correctly respect any meal-framework exceptions already configured for that campout (Requirement 4) — removing and re-adding a patrol doesn't reset that configuration.

## Decision assumed (flag if this isn't what you want)

Removal is allowed at **any** menu status, including Approved — consistent with Requirement 8's own precedent that deleting a patrol entirely is allowed even with Approved menus, provided the warning is clear. REQ-10.3's confirmation is what prevents this from being an accident; there's no separate "block if Approved" rule layered on top. If you'd rather Approved menus be protected from per-campout removal (even though whole-patrol deletion already isn't), say so and this gets revised.

## Acceptance Criteria

- [ ] A patrol with an assigned menu on a campout shows a working "Remove from campout" control.
- [ ] Clicking it requires an explicit confirmation naming the dish count and Approved status before anything is deleted — not a single ambient click.
- [ ] After confirming, that one menu (and its meals/dishes/ingredients/reviews) is gone; the same patrol's menus on other campouts are untouched; the patrol itself still exists and is unaffected in Manage Patrols.
- [ ] The removed patrol's card disappears from the campout's list and immediately reappears as a choice in the "Add patrol" picker.
- [ ] A campout where every active patrol already has a menu shows the "Add patrol" control disabled (or absent) — not an empty/broken-looking picker.
- [ ] Creating a new patrol and either declining the future-campouts prompt, or having it correctly skip a past campout, leaves that patrol addable via this campout's "Add patrol" picker.
- [ ] Re-assigning a previously-removed patrol to the same campout respects any meal-framework exceptions already configured for that campout — removed occasions stay removed.

## Out of Scope for This Requirement

- Any change to Requirement 8's "delete patrol entirely" behavior — that remains global and separate from this campout-scoped removal.
- Bulk remove/add across multiple campouts at once — this is a single-campout, single-patrol action, same granularity as the existing assign form.
- Undo — removal is immediate and permanent once confirmed, same as every other destructive action in the app so far (no soft-delete/trash concept exists anywhere).

## Related

- [Requirement 1 - Core Approval Loop](../roadmap-iterations/01-core-approval-loop.md) — the existing `assignMenu` action the "Add patrol" picker calls underneath.
- [Requirement 4 - Meal-Framework Variation](../roadmap-iterations/04-meal-framework-variation.md) — meal-framework exceptions are campout+patrol scoped and explicitly preserved across a remove/re-add cycle (REQ-10.2/10.7).
- [Requirement 7 - Campout Dashboard Layout](../ux-interaction-polish/07-campout-dashboard-layout.md) (REQ-7.12) and [Requirement 8 - Manage Patrols](08-manage-patrols.md) — this requirement revises the campout detail page's patrol display from "a row for every active patrol" to "a row for every patrol that's actually on this campout, plus a disable-able Add control" (a direct consequence of Requirement 8 making the patrol roster unbounded), and reuses Requirement 8's cascading-delete-behind-a-confirmation-dialog pattern at a smaller (single-menu) scope — `components/DeletePatrolDialog.tsx` is the direct precedent for whatever confirmation UI this builds.
- This is a straightforward feature extension of already-established patterns (manual cascade delete per ADR 0012/0018, confirm-before-destroy per Requirement 8) — it isn't expected to need its own ADR when built, unlike Requirement 8.
