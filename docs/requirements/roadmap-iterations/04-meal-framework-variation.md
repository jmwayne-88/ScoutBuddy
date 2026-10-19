# Iteration 4 — Meal-Framework Variation

Status: Not started
Depends on: [Iteration 3 - Multiple Campouts](03-multiple-campouts.md)

## Goal

Give the ASPL the flexibility real campouts need (e.g., no Friday Cracker Barrel on a campout with a late Friday arrival).

## Requirements

- **REQ-4.1** ASPL can remove one or more of the six standard occasions from a campout's meal framework.
- **REQ-4.2** Removal can be scoped to one specific patrol's menu.
- **REQ-4.3** Removal can be scoped to all patrols' menus for that campout at once.
- **REQ-4.4** A removed occasion does not appear at all in the affected Patrol Leader's menu — no meal section, no dishes, nothing to fill in.
- **REQ-4.5** ASPL can restore a previously removed occasion, and it reappears (empty) in the affected menu(s).
- **REQ-4.6** ASPL cannot add non-standard occasions beyond the six defined in the standard meal framework.
- **REQ-4.7** Patrol Leader has no ability to remove or add occasions themselves.
- **REQ-4.8** Variation is editable by the ASPL after the menu has already been assigned, not just at initial assignment.

## Acceptance Criteria

- [ ] ASPL removes one occasion for a single named patrol; that patrol's menu no longer shows it, while the other three patrols' menus for the same campout are unaffected.
- [ ] ASPL removes an occasion for all patrols at once; none of the four patrols' menus for that campout show it.
- [ ] ASPL restores a previously removed occasion; it reappears in the affected menu(s), empty and ready to fill in.
- [ ] A menu with removed occasions can still be submitted and approved normally, using only its active occasions.

## Out of Scope for This Iteration

Nutrition/allergy note logic, non-standard occasion creation.

## Related

- [FEATURES.md](../../FEATURES.md) — Meal-Framework Variation
- [ADR 0006 - Structured meal-framework variation](../adr/0006-structured-meal-framework-variation.md)
- [ROADMAP.md](../../ROADMAP.md) — Iteration 4
