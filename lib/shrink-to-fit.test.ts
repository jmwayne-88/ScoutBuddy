import { describe, expect, it } from "vitest";
import { computeShrinkToFitSize } from "./shrink-to-fit";

// These exercise the decision algorithm only -- not real DOM measurement,
// which nothing in this environment can verify without an actual browser.
// `measureHeightAtSize` here is a stand-in for a real `scrollHeight` read.
describe("computeShrinkToFitSize", () => {
  it("keeps the max size when content already fits at that size", () => {
    const size = computeShrinkToFitSize(() => 500, 960);
    expect(size).toBe(12);
  });

  it("steps down until content fits", () => {
    // Pretend height shrinks by 40px per 0.5pt step, starting at 1200px (at 12pt).
    const heightAt = (size: number) => 1200 - (12 - size) * 80;
    const size = computeShrinkToFitSize(heightAt, 1000);
    // 1200 - (12-size)*80 <= 1000  =>  (12-size) >= 2.5  =>  size <= 9.5 -> steps land on 9.5
    expect(size).toBe(9.5);
  });

  it("never goes below the floor even if content still doesn't fit", () => {
    const size = computeShrinkToFitSize(() => 100000, 960);
    expect(size).toBe(8);
  });

  it("respects custom min/max/step", () => {
    const size = computeShrinkToFitSize(() => 100000, 960, { min: 6, max: 14, step: 1 });
    expect(size).toBe(6);
  });
});
