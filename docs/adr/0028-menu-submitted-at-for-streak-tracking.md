# 0028. `Menu.submittedAt`, set once, backs the on-time streak

Date: 2026-10-19
Status: Accepted

## Context

[Requirement 25](../requirements/25-lightweight-gamification.md) asks for a Patrol Leader's "on-time streak" — a count of consecutive menus submitted at or before their due date — computed, per REQ-25.1, "from existing data only... if the current schema doesn't already timestamp the Submitted transition itself, that one addition, and only that one, may be needed, and must get its own ADR if so."

`Menu` had no such timestamp. `status` only records the current state, not when any particular transition happened; `Review.createdAt` exists but a `Review` row is only ever created by `approveMenu`/`rejectMenu` (the ASPL's decision), never by `submitMenu` itself — so there was no existing field anywhere that recorded when a menu first reached `Submitted`.

REQ-25.3 additionally requires that a Changes-Requested → edit → resubmit cycle never resets or otherwise affects the streak — only a missed due date does (per [ADR 0013](0013-submitted-menu-edits-do-not-revert-status.md)'s unlimited revise-and-resubmit model). That constrains not just whether to add a timestamp, but when it gets written.

## Decision

Add a nullable `Menu.submittedAt DateTime?` column, written exactly once: in `submitMenu` (`app/(app)/menus/[id]/actions.ts`), only when the menu doesn't already have one (`submittedAt: menu.submittedAt ?? new Date()`). A later Changes-Requested → resubmit cycle calls `submitMenu` again but leaves the original `submittedAt` untouched, so it always reflects the *first* time the menu was ever submitted — exactly the event REQ-25.1 asks to compare against `dueDate`.

The streak itself is computed by a new pure function, `lib/streaks.ts`'s `onTimeStreak()`: given a patrol's menus (each with `dueDate`/`submittedAt`), it walks them most-recent-due-first, counting a menu as a "hit" if `submittedAt <= dueDate`, stopping at the first "miss" (due date passed with no on-time `submittedAt`). A menu not yet due is skipped — neither a hit nor a miss — so an upcoming, unsubmitted menu can't reset a streak built on past campouts.

## Alternatives Considered

- **Derive "on time" from `Review.createdAt` instead of a new column**: rejected outright — a `Review` only exists after the ASPL acts, which could be days after submission (or never, if nothing's been reviewed yet); it answers "when was this reviewed," not "when was this submitted," and REQ-25.1 is explicit that the comparison is against the submission event, not the review.
- **Update `submittedAt` on every transition into `Submitted`, including resubmission after Changes Requested**: simpler to reason about ("the most recent submission time") but directly violates REQ-25.3 — a Changes-Requested cycle's resubmission could land after the original due date even though the *first* submission was on time, incorrectly turning an on-time menu into a late one and penalizing normal, expected revision cycles.
- **A separate `MenuSubmissionEvent` log table, recording every submit/resubmit**: would support richer future queries (e.g. "how many revision cycles did this menu need") but is more schema than REQ-25.1's "that one addition, and only that one" calls for, for a single cosmetic feature that only ever needs the first event.

## Consequences

- `submittedAt` can be `null` for any menu that has never reached `Submitted` (including one currently `NOT_STARTED`/`IN_PROGRESS`) — `onTimeStreak()` treats a due, never-submitted menu as a miss, same as a late one.
- If a future feature needs "when was this most recently (re)submitted," it will need either a second column or the event-log alternative above — `submittedAt` is deliberately first-submission-only and shouldn't be repurposed.
- Applied to the `development` Neon branch directly (`ALTER TABLE "Menu" ADD COLUMN "submittedAt" TIMESTAMP(3);`, migration `20261019014758_add_menu_submitted_at`); still needs the separate, deliberate `production` migration step [ADR 0014](0014-separate-dev-test-database-branch.md) describes before this ships live.

## Related

- [Requirement 25 - Lightweight Gamification (Streaks & Recognition)](../requirements/25-lightweight-gamification.md)
- [ADR 0013 - Editing a Submitted menu does not revert its status](0013-submitted-menu-edits-do-not-revert-status.md) — the unlimited-revision model REQ-25.3 relies on to justify never penalizing a Changes-Requested cycle.
- [ADR 0014 - Separate Neon branch for development and testing](0014-separate-dev-test-database-branch.md) — this schema change follows that same develop-then-deploy migration path.
