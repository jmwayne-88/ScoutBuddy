# ScoutBuddy — Core Experience Feature Spec

Status: documentation only, not yet built. Covers the "build first" scope from the brief: a menu approval workflow with two roles, Patrol Leader and ASPL of Camping.

## Roles

- **Patrol Leader** — youth, mid-term, builds and submits their patrol's menu for a campout.
- **ASPL of Camping** — youth, sets up campouts, assigns menu tasks, reviews submissions.

## Entities

- **Campout** — name, date.
- **Patrol** — fixed set of four, not user-creatable: Eagle (blue), Puma (gold), Raven (dark purple), Silver Fox (silver).
- **Menu** — one per (campout, patrol) pair. Has a due date, a status, and a set of active meal occasions (see Meal-Framework Variation below).
- **Meal** — one per standard occasion, scoped to a menu. Only occasions the ASPL has left active appear.
- **Dish** — one or more per meal, has a name.
- **Ingredient** — belongs to a dish, has a name and quantity.
- **Review** — the ASPL's approve/reject decision on a submission, with comments on reject.

## Standard Meal Framework

Six fixed occasions, always in this order:

1. Friday Cracker Barrel
2. Saturday Breakfast
3. Saturday Lunch
4. Saturday Dinner
5. Saturday Cracker Barrel
6. Sunday Breakfast

## Meal-Framework Variation (structured, ASPL-controlled)

- The ASPL can **remove one or more occasions** from the standard meal framework for a campout.
- Removal can be applied **to one specific patrol's menu** or **to all patrols' menus** for that campout.
- A removed occasion does not appear in the affected menu(s) at all — no meal, no dishes, nothing for the Patrol Leader to fill in.
- The ASPL can only remove occasions, not add non-standard ones, in this scope.
- Removal is set at assignment time (or later edited by the ASPL); it is not something the Patrol Leader controls.

## Menu Building (Patrol Leader)

- View their assigned menu for a campout: the active meal occasions (per the ASPL's variation), each with any assigned due date.
- Per occasion, add/edit/remove one or more named dishes.
- Per dish, add/edit/remove ingredients with quantities (short list, no units enforcement).
- Fill in two free-text fields for the whole menu, unvalidated:
  - Nutrition / MyPlate balance note.
  - Patrol allergy note.
- Submit the menu when ready.
- **Can continue to edit the menu at any point up through Submitted and Changes Requested — editing is only locked once the menu reaches Approved.**

## Campout & Assignment (ASPL)

- Create a campout: name, date.
- For a campout, assign a menu to a patrol: set a due date.
- Remove meal occasions from the standard framework for that campout, either for one named patrol or for all patrols at once.
- View the status of each patrol's menu for the campout.

## Review (ASPL)

- View a submitted menu in full: all active occasions, their dishes and ingredients, and both free-text notes.
- Approve the menu, or reject it with required comments.
- Comments persist and remain visible to the Patrol Leader through revision (not a single overwritable field — a running record tied to the submission).

## Status Lifecycle & Permissions

Statuses: **Not Started → In Progress → Submitted → Changes Requested → Approved**

- Patrol Leader:
  - Can edit the menu (add/remove dishes, ingredients, notes) in any status except Approved.
  - Can move the menu to Submitted.
  - Cannot set Changes Requested or Approved (cannot self-approve or self-reject).
- ASPL:
  - Can set Changes Requested (with required comments) or Approved on a Submitted menu.
  - Does not directly edit the menu's dishes/ingredients — only reviews and decides.
- Revise-and-resubmit is unlimited; there is no cap on Changes Requested ⇄ edit cycles.
- Open implementation detail (not yet decided): whether a Patrol Leader edit made while status is Submitted silently reverts status to In Progress (requiring an explicit re-submit) or leaves it Submitted while edited. Flagged for a decision at build time.

## Visual Identity

- Every place a patrol is shown (menu list, campout view, assignment view) is color-coded by patrol using background color only:
  - Eagle Patrol — blue
  - Puma Patrol — gold
  - Raven Patrol — dark purple
  - Silver Fox Patrol — silver
- Foreground text color is chosen automatically for readable contrast against each background; not manually set per patrol.

## Language

Use real troop language throughout, never genericized: Patrol Leader, ASPL of Camping, patrol, campout, Cracker Barrel, meal framework.

## Starting State

- The app starts from a truly empty state: no seeded campouts, patrols' rosters, or menus beyond the fixed four patrols themselves.

## Explicitly Out of Scope (future, not built now)

- Shopping list rolled up from all ingredients across dishes/menus.
- Saved library of past menus for reuse across terms.
- Automatic due-date calculation.
- Adult read-only oversight view.
- Formal adult sign-off step.

The data model should leave room for these later (e.g., menus and their dishes/ingredients aren't hard-deleted, ingredient data is structured enough to later roll up into a shopping list) but no UI or logic for them exists in this scope.
