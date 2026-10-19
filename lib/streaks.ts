// REQ-25.1/25.3: a Patrol Leader's on-time streak, derived entirely from
// existing Menu data (dueDate, submittedAt) -- no review outcome, status,
// or patrol comparison is ever part of this computation. See ADR 0028 for
// why `submittedAt` exists and when it's set.
export type MenuSubmissionRecord = {
  dueDate: Date;
  submittedAt: Date | null;
};

// Counts consecutive on-time menus, most-recent-due first, stopping at the
// first miss. A menu whose due date hasn't arrived yet is neither a hit nor
// a miss -- it's simply not counted, so an upcoming (unsubmitted) menu never
// resets a streak built on past campouts. A menu is "on time" if it was
// first submitted at or before its due date; see submitMenu in
// app/(app)/menus/[id]/actions.ts for why a Changes-Requested resubmission
// can never turn an on-time menu into a late one (submittedAt isn't
// overwritten on resubmit).
export function onTimeStreak(menus: MenuSubmissionRecord[], now: Date = new Date()): number {
  const sorted = [...menus].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

  let streak = 0;
  for (const menu of sorted) {
    if (menu.dueDate.getTime() > now.getTime()) continue;

    const onTime = menu.submittedAt !== null && menu.submittedAt.getTime() <= menu.dueDate.getTime();
    if (!onTime) break;
    streak += 1;
  }
  return streak;
}
