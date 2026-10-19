# Iteration 5 — Workflow Hardening & Polish

Status: Not started
Depends on: [Iteration 4 - Meal-Framework Variation](04-meal-framework-variation.md)

## Goal

Close the gaps that only surface once the loop gets used for real, so the workflow is trustworthy enough to hand fully to youth leaders.

## Requirements

- **REQ-5.1** A decision is made and documented as its own ADR on whether editing a Submitted menu automatically reverts its status to In Progress, or leaves it Submitted-but-edited (the open question flagged in FEATURES.md's Status Lifecycle & Permissions section).
- **REQ-5.2** The behavior chosen in REQ-5.1 is implemented consistently everywhere a Patrol Leader can edit a Submitted menu.
- **REQ-5.3** All review comments across every revision cycle remain visible to the Patrol Leader, not just the most recent rejection.
- **REQ-5.4** Each comment is timestamped and associated with the specific submission/revision it was made against.
- **REQ-5.5** A brand-new campout, patrol menu, or empty occasion shows a clear, intentional empty state rather than a blank or broken view.
- **REQ-5.6** A menu cannot be submitted if any active occasion has zero dishes.
- **REQ-5.7** The nutrition/MyPlate note and allergy note remain completely unvalidated — REQ-5.6's guardrail does not extend to these fields.

## Acceptance Criteria

- [ ] The Submitted-edit status behavior is documented in a new ADR and matches what the app actually does.
- [ ] A Patrol Leader can view comments from more than one past rejection on the same menu, each clearly tied to its revision.
- [ ] Attempting to submit a menu with an empty active occasion is blocked with a clear reason shown to the Patrol Leader.
- [ ] Submitting a menu with blank nutrition/allergy notes succeeds without any warning or block.
- [ ] Opening a freshly assigned menu, an empty campout, or a campout list with zero campouts shows appropriate empty-state messaging, not a blank screen or crash.

## Out of Scope for This Iteration

Any of the five future-scope items: shopping list rollup, saved menu library, automatic due-date calculation, adult read-only view, formal adult sign-off.

## Related

- [FEATURES.md](../../FEATURES.md) — open implementation detail note under Status Lifecycle & Permissions
- [ROADMAP.md](../../ROADMAP.md) — Iteration 5
