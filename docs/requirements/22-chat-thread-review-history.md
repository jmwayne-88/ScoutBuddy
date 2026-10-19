# Requirement 22 — Chat-Thread Review History

Status: Done
Depends on: [Requirement 5](05-workflow-hardening-and-polish.md)'s REQ-5.3/5.4 (every revision's comments stay visible and timestamped — the data this requirement re-presents, not re-derives)

## Goal

Restyle the menu page's review-history section from a flat list of form-like cards into a two-sided chat thread — the ASPL's decisions and comments on one side, visually distinct from the Patrol Leader's menu, closer to the back-and-forth messaging UI this app's youth audience already uses every day than to a changelog.

## Source

Recommendation #17 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section.

## Problem

`app/(app)/menus/[id]/page.tsx`'s "Review history" section renders `menu.reviews` as a plain vertical list of identical outlined `Paper` cards, each showing "Approved" or "Changes requested," a raw date, and an optional comment — visually indistinguishable from the "Meal framework for this campout" exceptions list just above it on the campout page, even though this section represents a conversation between two specific people (the Patrol Leader who submitted, the ASPL who responded) across possibly several rounds.

## Requirements

- **REQ-22.1** Each review entry renders as a chat bubble rather than a bordered card: an Approved or Changes Requested decision, with its comment (if any), aligned and styled as a single message from the ASPL — visually distinct from how the Patrol Leader's own content (dishes, notes) reads elsewhere on the same page.
- **REQ-22.2** Consecutive review rounds render as a vertical thread, oldest to newest (matching the existing `orderBy: { createdAt: "asc" }` in `app/(app)/menus/[id]/page.tsx`'s query) — this requirement changes presentation only, not ordering.
- **REQ-22.3** A Changes-Requested review's comment is visually the primary content of its bubble (comments are required for that decision per existing permission rules in `lib/permissions.ts`/[ADR 0007](../adr/0007-menu-status-lifecycle-and-permissions.md)); an Approved review (which has no comment) renders as a shorter, celebratory-toned bubble rather than an empty card with just a date.
- **REQ-22.4** Each bubble shows a relative, humanized timestamp using the same date-formatting helper [Requirement 13](13-ux-quick-win-polish.md) introduced (`lib/dates.ts`'s `formatDueDate`/`formatEventDate`, or a close variant suited to a past-only timestamp — "3 days ago" rather than a due-date-style forward projection), with the exact date still available as a tooltip.
- **REQ-22.5** The thread visually distinguishes the ASPL's role from the Patrol Leader's without inventing a new identity system — reuse the existing patrol color (already shown via `components/PatrolBadge.tsx` at the top of the same page) as the "other side" of the conversation's accent, rather than introducing unrelated new colors.
- **REQ-22.6** This requirement does not add any new interaction (replying inline, reacting, editing a past comment) — it is a visual restyle of existing, already-complete review data; the review/approve/reject actions themselves (`approveMenu`, `rejectMenu` in `app/(app)/menus/[id]/actions.ts`) are unchanged.

## Acceptance Criteria

- [x] A menu with multiple rounds of Changes Requested / resubmission shows each round as a distinct chat-style bubble in chronological order.
- [x] An Approved review and a Changes-Requested review are visually distinguishable from each other at a glance, not just by their text label.
- [x] Every bubble shows a relative timestamp with the exact date available on hover/tap.
- [x] No new comment-authoring, editing, or reaction capability is introduced — the thread is read-only, exactly as the existing review history is today.
- [x] A menu with zero reviews shows no thread at all (unchanged from today's `menu.reviews.length > 0` guard).

## Out of Scope for This Requirement

- Any new interaction capability (inline reply, reactions, editing) — explicitly excluded by REQ-22.6.
- Real-time/live updates to the thread (e.g. a Patrol Leader seeing a new review appear without refreshing) — out of scope; the existing request/response model is unchanged.
- Changes to the underlying `Review` data model or the approve/reject Server Actions.

## Related

- [Requirement 5 - Workflow Hardening & Polish](05-workflow-hardening-and-polish.md) — REQ-5.3/5.4's guarantee that every revision's comments stay visible and timestamped is the data contract this requirement's thread depends on.
- [ADR 0007 - Menu status lifecycle as a role-gated state machine](../adr/0007-menu-status-lifecycle-and-permissions.md) — the approve/reject rules this requirement's thread reflects but does not change.
- [Requirement 13 - UX Quick-Win Polish Pass](13-ux-quick-win-polish.md) — the relative-date helper this requirement's timestamps reuse.
