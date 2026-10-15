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
