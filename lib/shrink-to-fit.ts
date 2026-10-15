// The pure decision logic behind ShrinkToFitPage.tsx -- mirrors Word's own
// "shrink to fit" algorithm: step the font size down from a normal size
// until measured content height fits the available space, never going
// below a floor. Decoupled from the DOM so it can be unit-tested; the
// component supplies `measureHeightAtSize` as a real `scrollHeight` read
// at each candidate size (something only a real browser can do -- nothing
// here can verify that half of the behavior without one).
export function computeShrinkToFitSize(
  measureHeightAtSize: (size: number) => number,
  availableHeight: number,
  { min = 8, max = 12, step = 0.5 }: { min?: number; max?: number; step?: number } = {}
): number {
  let size = max;
  while (size > min && measureHeightAtSize(size) > availableHeight) {
    size -= step;
  }
  return size;
}
