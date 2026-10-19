import { describe, expect, it } from "vitest";
import { onTimeStreak } from "./streaks";

const NOW = new Date("2026-10-18T00:00:00Z");
const day = (offset: number) => new Date(NOW.getTime() + offset * 24 * 60 * 60 * 1000);

describe("onTimeStreak", () => {
  it("counts consecutive on-time menus, most-recent-due first", () => {
    const menus = [
      { dueDate: day(-30), submittedAt: day(-31) },
      { dueDate: day(-20), submittedAt: day(-21) },
      { dueDate: day(-10), submittedAt: day(-11) },
    ];
    expect(onTimeStreak(menus, NOW)).toBe(3);
  });

  it("stops at the first miss going backward from the most recent", () => {
    const menus = [
      { dueDate: day(-30), submittedAt: day(-31) }, // on time, but older than the miss
      { dueDate: day(-20), submittedAt: null }, // missed
      { dueDate: day(-10), submittedAt: day(-11) }, // on time, most recent
    ];
    expect(onTimeStreak(menus, NOW)).toBe(1);
  });

  it("treats a late submission the same as a missing one", () => {
    const menus = [{ dueDate: day(-10), submittedAt: day(-9) }];
    expect(onTimeStreak(menus, NOW)).toBe(0);
  });

  it("ignores a menu whose due date hasn't arrived yet", () => {
    const menus = [
      { dueDate: day(-10), submittedAt: day(-11) },
      { dueDate: day(10), submittedAt: null }, // not due yet -- doesn't break the streak
    ];
    expect(onTimeStreak(menus, NOW)).toBe(1);
  });

  it("is zero for an empty list", () => {
    expect(onTimeStreak([], NOW)).toBe(0);
  });

  it("does not penalize a Changes-Requested cycle, since submittedAt reflects only the first submission", () => {
    // A menu resubmitted after Changes Requested still has its original,
    // on-time submittedAt -- the resubmission never overwrites it.
    const menus = [{ dueDate: day(-10), submittedAt: day(-11) }];
    expect(onTimeStreak(menus, NOW)).toBe(1);
  });
});
