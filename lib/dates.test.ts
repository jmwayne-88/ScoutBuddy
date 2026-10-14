import { describe, expect, it } from "vitest";
import { firstMondayOfMonthBefore } from "./dates";

describe("firstMondayOfMonthBefore", () => {
  it("returns a Monday", () => {
    const result = firstMondayOfMonthBefore(new Date(2026, 10, 14)); // November 14, 2026
    expect(result.getDay()).toBe(1);
  });

  it("falls in the calendar month immediately before the campout's month", () => {
    const result = firstMondayOfMonthBefore(new Date(2026, 10, 14)); // November
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(9); // October (0-indexed)
  });

  it("is the earliest Monday in that month (within the first 7 days)", () => {
    const result = firstMondayOfMonthBefore(new Date(2026, 10, 14));
    expect(result.getDate()).toBeGreaterThanOrEqual(1);
    expect(result.getDate()).toBeLessThanOrEqual(7);
  });

  it("rolls the year back correctly when the campout is in January", () => {
    const result = firstMondayOfMonthBefore(new Date(2027, 0, 15)); // January 2027
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDay()).toBe(1);
  });

  it("works when the 1st of the prior month is already a Monday", () => {
    // June 1, 2026 is a Monday, so a campout in July 2026 should default
    // to exactly June 1.
    const result = firstMondayOfMonthBefore(new Date(2026, 6, 10)); // July 10, 2026
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5); // June
    expect(result.getDate()).toBe(1);
    expect(result.getDay()).toBe(1);
  });
});
