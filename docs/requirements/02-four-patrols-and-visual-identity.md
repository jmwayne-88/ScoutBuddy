# Iteration 2 — All Four Patrols + Visual Identity

Status: Not started
Depends on: [Iteration 1 - Core Approval Loop](01-core-approval-loop.md)

## Goal

Scale the core approval loop to how a campout actually works: four patrols, each visually distinct.

## Requirements

- **REQ-2.1** All four patrols exist as fixed, pre-seeded entities: Eagle, Puma, Raven, Silver Fox.
- **REQ-2.2** Each patrol has a defined background color: Eagle blue, Puma gold, Raven dark purple, Silver Fox silver.
- **REQ-2.3** ASPL can assign an independent menu to each of the four patrols for a given campout.
- **REQ-2.4** Each patrol's menu for a campout has its own status and content, independent of the other three.
- **REQ-2.5** Everywhere a patrol is displayed (assignment view, menu list, campout dashboard), its background color is applied.
- **REQ-2.6** Foreground text color is computed automatically for readability against each patrol's background — never manually set per patrol.
- **REQ-2.7** ASPL can view all four patrols' menu statuses for a campout at a glance, without opening each one individually.

## Acceptance Criteria

- [ ] A campout can have up to four menus assigned, one per patrol, independently.
- [ ] Each patrol's name/badge shows its correct background color with readable text in every view it appears.
- [ ] ASPL sees the status of all four patrols' menus for one campout without opening each individually.
- [ ] Editing one patrol's menu has no effect on another patrol's menu for the same campout.

## Out of Scope for This Iteration

Multiple campouts, meal-framework variation.

## Related

- [FEATURES.md](../../FEATURES.md) — Visual Identity
- [ROADMAP.md](../../ROADMAP.md) — Iteration 2
