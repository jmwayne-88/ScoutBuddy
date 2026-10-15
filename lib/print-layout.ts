// REQ-12.8: shrink text as content volume grows, never below 8pt. This is
// a deterministic approximation from a row count, not real layout
// measurement (nothing server-rendered can measure actual print pagination)
// -- if content still overflows even at 8pt, the browser's own print
// pagination naturally spills it onto a further page, which is the
// accepted fallback, not something this function tries to prevent.
export function pickFontSize(itemCount: number): number {
  if (itemCount <= 15) return 11;
  if (itemCount <= 22) return 10;
  if (itemCount <= 30) return 9;
  return 8;
}

// The shopping list carries more visual weight per row than page 1's dish
// summary -- a checkbox, a quantity, and a meal/dish tag alongside each
// ingredient name, plus a category header (its own line of vertical space)
// every time the category changes. Weighting each category header as
// worth ~2 ingredient rows and shrinking at lower thresholds than
// pickFontSize reflects that, so the shopping list reaches for page 2's
// 8pt floor sooner -- still an approximation, not a guarantee (same caveat
// as pickFontSize): an unusually large list can still spill past one page.
export function pickShoppingListFontSize(rowCount: number, categoryCount: number): number {
  const weightedCount = rowCount + categoryCount * 2;
  if (weightedCount <= 10) return 11;
  if (weightedCount <= 16) return 10;
  if (weightedCount <= 22) return 9;
  return 8;
}
