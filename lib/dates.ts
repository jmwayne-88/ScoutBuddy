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
