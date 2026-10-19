# Iteration 3 — Multiple Campouts

Status: Not started
Depends on: [Iteration 2 - All Four Patrols + Visual Identity](02-four-patrols-and-visual-identity.md)

## Goal

Support planning across a whole term, not just one campout at a time.

## Requirements

- **REQ-3.1** ASPL can create multiple campouts, each independent, with its own name and date.
- **REQ-3.2** ASPL can view a list of all campouts.
- **REQ-3.3** Selecting a campout from the list shows that campout's own four patrol menus, independent of any other campout's.
- **REQ-3.4** Menu content and status are scoped per (campout, patrol) pair, never shared across campouts.

## Acceptance Criteria

- [ ] ASPL creates two or more campouts and confirms they appear as separate entries in a campout list.
- [ ] Assigning or editing a menu on one campout does not affect the same patrol's menu on a different campout.
- [ ] Navigating between campouts correctly loads each campout's own set of four patrol menus.

## Out of Scope for This Iteration

Meal-framework variation, any cross-campout reporting or history (that's future scope — the saved menu library).

## Related

- [FEATURES.md](../../FEATURES.md) — Campout & Assignment
- [ROADMAP.md](../../ROADMAP.md) — Iteration 3
