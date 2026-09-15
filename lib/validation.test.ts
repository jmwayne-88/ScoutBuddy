import { describe, expect, it } from "vitest";
import { menuHasEmptyOccasion } from "./validation";

describe("menuHasEmptyOccasion", () => {
  it("is false when every active occasion has at least one dish", () => {
    expect(menuHasEmptyOccasion([{ dishes: [{}] }, { dishes: [{}, {}] }])).toBe(false);
  });

  it("is true when any active occasion has zero dishes", () => {
    expect(menuHasEmptyOccasion([{ dishes: [{}] }, { dishes: [] }])).toBe(true);
  });

  it("is false when there are no active occasions at all", () => {
    expect(menuHasEmptyOccasion([])).toBe(false);
  });
});
