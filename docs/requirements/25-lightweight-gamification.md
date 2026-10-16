# Requirement 25 — Lightweight Gamification (Streaks & Recognition)

Status: Not started
Depends on: none tied to a single ROADMAP iteration; purely additive over existing menu/review data

## Goal

Give Patrol Leaders a small, low-stakes sense of recognition for on-time, complete menu submissions — a streak count and/or a simple badge — entirely as a cosmetic layer over data the app already has, with zero effect on the approval workflow itself.

## Source

Recommendation #20 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section — the last and most explicitly optional of the twenty recommendations; the audit itself noted this is worth doing only once the core loop is proven in real troop use, echoing ROADMAP.md's own sequencing philosophy ("polish and hardening come last, once real usage... has surfaced what actually needs tightening").

## Principles (non-negotiable for this requirement)

- **Purely cosmetic.** Nothing in this requirement may gate, block, or alter any permission, status transition, or due date. A Patrol Leader with a zero streak can submit, edit, and get approved exactly as freely as one with a ten-campout streak.
- **No public shaming.** This is a youth-led troop; a visible "worst streak" leaderboard or any framing that singles out a struggling patrol is explicitly excluded. Recognition is positive-only.
- **No new pressure on the ASPL.** The ASPL's review decisions (`approveMenu`/`rejectMenu`) must never be influenced by, or need to account for, a patrol's streak — a Changes-Requested decision is made on the menu's merits alone, same as today.

## Requirements

- **REQ-25.1** A Patrol Leader's "on-time streak" is computed from existing data only — no new fields are required on `Menu`: a menu counts as "on time" if it reached `Submitted` status at or before its `dueDate` (comparing `Menu.dueDate` against the earliest `Review`-eligible submission event, derivable from existing `status`/timestamps — if the current schema doesn't already timestamp the Submitted transition itself, that one addition, and only that one, may be needed, and must get its own ADR if so).
- **REQ-25.2** The streak is shown only to the Patrol Leader it belongs to (on `/patrol-leader` and/or the menu page), not broadcast to the ASPL or other patrols — consistent with the no-public-shaming principle; the ASPL's own views (`/campouts`, the campout detail page) show no streak information at all.
- **REQ-25.3** A streak resets to zero when a menu reaches its due date without having been submitted on time — not when a menu gets Changes Requested (a Changes-Requested cycle is a normal, expected part of the workflow per [ADR 0013](../adr/0013-submitted-menu-edits-do-not-revert-status.md)'s "unlimited revise-and-resubmit" model, and must never be treated as a strike against the streak).
- **REQ-25.4** A simple badge/recognition moment (e.g. a small icon or a one-line note — "3 campouts in a row on time!") appears at a natural, already-existing moment in the flow (the Patrol Leader's own menu list, or alongside the celebratory Approved toast from [Requirement 13](13-ux-quick-win-polish.md)'s REQ-13.4) rather than as a new, separate destination/page to visit.
- **REQ-25.5** This requirement introduces no numeric score, ranking, or comparison between patrols anywhere in the UI — a streak is a count tied to one patrol's own history, never compared against another patrol's.
- **REQ-25.6** All visual treatment (badge icon, streak number styling) uses theme tokens, per CLAUDE.md's design-system rule — no new raw hex values.

## Acceptance Criteria

- [ ] A Patrol Leader whose patrol has submitted its last three menus on time sees a streak indicator reflecting that.
- [ ] No ASPL-facing view shows any patrol's streak or any form of patrol-to-patrol comparison.
- [ ] A Changes-Requested cycle does not reset or otherwise affect the streak, only a missed due date does.
- [ ] Nothing about submission, editing, or review permissions changes based on a patrol's streak value.
- [ ] If a new `Menu` field was needed to compute submission timing, it is documented in its own ADR.

## Out of Scope for This Requirement

- Any leaderboard, ranking, or cross-patrol comparison — explicitly excluded by the no-public-shaming principle.
- Any gamification mechanic that affects workflow behavior (e.g. "a high streak lets you skip a step") — this requirement is strictly cosmetic.
- Troop-wide/ASPL-facing recognition (e.g. "which patrol has the longest streak this term") — out of scope for the reasons above; if ever reconsidered, it would need its own requirement and an explicit decision that it's compatible with a youth-led troop's social dynamics.

## Related

- [Requirement 13 - UX Quick-Win Polish Pass](13-ux-quick-win-polish.md) — REQ-13.4's celebratory Approved toast is the natural moment REQ-25.4's badge recognition could attach to.
- [ADR 0013 - Editing a Submitted menu does not revert its status](../adr/0013-submitted-menu-edits-do-not-revert-status.md) — the unlimited-revision model that REQ-25.3 relies on to justify never penalizing a Changes-Requested cycle.
- ROADMAP.md's sequencing rationale — the general principle ("polish... once real usage has surfaced what actually needs tightening") this requirement's own Source section echoes as the reason it should likely be built last among all the requirements in this set.
