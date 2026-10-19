# Iteration 1 — Core Approval Loop (Single Patrol, Single Campout)

Status: Not started
Depends on: none — first iteration

## Goal

Prove the entire menu approval workflow end-to-end for one patrol on one campout.

## Requirements

- **REQ-1.1** ASPL can create a campout with a name and a date.
- **REQ-1.2** ASPL can assign a menu to a patrol for a campout, setting a due date.
- **REQ-1.3** A newly assigned menu starts in **Not Started** status with all six standard meal-framework occasions active.
- **REQ-1.4** Patrol Leader can view their assigned menu, structured by the six standard occasions.
- **REQ-1.5** Patrol Leader can add, edit, and remove named dishes within an occasion.
- **REQ-1.6** Patrol Leader can add, edit, and remove ingredients (name + quantity) within a dish.
- **REQ-1.7** Patrol Leader can enter/edit a free-text nutrition/MyPlate balance note for the menu.
- **REQ-1.8** Patrol Leader can enter/edit a free-text patrol allergy note for the menu.
- **REQ-1.9** Neither free-text note is validated or enforced in any way.
- **REQ-1.10** Patrol Leader can submit the menu, moving status to **Submitted**.
- **REQ-1.11** ASPL can view a submitted menu in full: all occasions, dishes, ingredients, and both notes.
- **REQ-1.12** ASPL can approve a Submitted menu, moving status to **Approved**.
- **REQ-1.13** ASPL can reject a Submitted menu with a required comment, moving status to **Changes Requested**.
- **REQ-1.14** Patrol Leader can revise a menu in Changes Requested status and resubmit, with no limit on cycles.
- **REQ-1.15** Patrol Leader cannot set their own menu to Changes Requested or Approved — enforced server-side, not just hidden in the UI.
- **REQ-1.16** Only the ASPL can set a menu's status to Changes Requested or Approved — enforced server-side.
- **REQ-1.17** A menu in Approved status can no longer be edited by the Patrol Leader.

## Acceptance Criteria

- [ ] ASPL creates a campout and assigns a menu to one patrol with a due date.
- [ ] Patrol Leader opens the assigned menu and sees all six occasions with no dishes yet.
- [ ] Patrol Leader adds at least one dish with ingredients to each occasion, fills in both notes, and submits.
- [ ] ASPL opens the submitted menu and sees everything the Patrol Leader entered.
- [ ] ASPL rejects with a comment; menu status becomes Changes Requested and the comment is visible to the Patrol Leader.
- [ ] Patrol Leader edits the menu and resubmits; status returns to Submitted.
- [ ] ASPL approves; status becomes Approved and the Patrol Leader can no longer edit it.
- [ ] Calling an approve/reject action as the Patrol Leader is rejected by the backend, not just hidden in the UI.

## Out of Scope for This Iteration

The other three patrols, multiple campouts, meal-framework variation (all six occasions are always active), patrol color visual identity.

## Related

- [FEATURES.md](../../FEATURES.md) — Menu Building, Campout & Assignment, Review, Status Lifecycle & Permissions
- [ADR 0007 - Menu status lifecycle](../adr/0007-menu-status-lifecycle-and-permissions.md)
- [ROADMAP.md](../../ROADMAP.md) — Iteration 1
