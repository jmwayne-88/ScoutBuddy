// Default due date for menus created in bulk (Requirement 8's new-patrol
// campout-assignment prompt and reactivation campout picker — REQ-8.16),
// where there's no per-menu form to type a due date into.
export function firstMondayOfMonthBefore(campoutDate: Date): Date {
  const priorMonthStart = new Date(campoutDate.getFullYear(), campoutDate.getMonth() - 1, 1);
  const dayOfWeek = priorMonthStart.getDay(); // 0 = Sunday .. 6 = Saturday
  const daysUntilMonday = (8 - dayOfWeek) % 7; // 0 if priorMonthStart is already a Monday
  priorMonthStart.setDate(priorMonthStart.getDate() + daysUntilMonday);
  return priorMonthStart;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RELATIVE_WINDOW_DAYS = 14;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(date: Date, now: Date): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

export type RelativeDateValue = { display: string; absolute: string; overdue: boolean };

// REQ-13.9/13.11: humanizes a due date within a +/-14 day window ("Due
// today", "Due in 3 days", "Overdue by 2 days"), falling back to the plain
// absolute date outside it. The absolute date is always returned too, so
// callers can show it as a tooltip rather than lose it.
export function formatDueDate(date: Date, now: Date = new Date()): RelativeDateValue {
  const diff = daysBetween(date, now);
  const absolute = date.toDateString();

  if (diff > RELATIVE_WINDOW_DAYS || diff < -RELATIVE_WINDOW_DAYS) {
    return { display: absolute, absolute, overdue: diff < 0 };
  }
  if (diff === 0) return { display: "Due today", absolute, overdue: false };
  if (diff === 1) return { display: "Due tomorrow", absolute, overdue: false };
  if (diff === -1) return { display: "Overdue by 1 day", absolute, overdue: true };
  if (diff > 1) return { display: `Due in ${diff} days`, absolute, overdue: false };
  return { display: `Overdue by ${-diff} days`, absolute, overdue: true };
}

// REQ-13.9/13.10: the same relative-window treatment for a plain event date
// (a campout's date) that isn't a deadline, so "overdue" framing never
// applies to it.
export function formatEventDate(date: Date, now: Date = new Date()): RelativeDateValue {
  const diff = daysBetween(date, now);
  const absolute = date.toDateString();

  if (diff > RELATIVE_WINDOW_DAYS || diff < -RELATIVE_WINDOW_DAYS) {
    return { display: absolute, absolute, overdue: false };
  }
  if (diff === 0) return { display: "Today", absolute, overdue: false };
  if (diff === 1) return { display: "Tomorrow", absolute, overdue: false };
  if (diff === -1) return { display: "Yesterday", absolute, overdue: false };
  if (diff > 1) return { display: `In ${diff} days`, absolute, overdue: false };
  return { display: `${-diff} days ago`, absolute, overdue: false };
}
