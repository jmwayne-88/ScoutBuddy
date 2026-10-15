import { describe, expect, it } from "vitest";
import { pickFontSize, pickShoppingListFontSize } from "./print-layout";

describe("pickFontSize", () => {
  it("uses the largest size for a small menu", () => {
    expect(pickFontSize(0)).toBe(11);
    expect(pickFontSize(15)).toBe(11);
  });

  it("steps down as content grows", () => {
    expect(pickFontSize(16)).toBe(10);
    expect(pickFontSize(22)).toBe(10);
    expect(pickFontSize(23)).toBe(9);
    expect(pickFontSize(30)).toBe(9);
  });

  it("never goes below 8pt no matter how large the menu is", () => {
    expect(pickFontSize(31)).toBe(8);
    expect(pickFontSize(1000)).toBe(8);
  });
});

describe("pickShoppingListFontSize", () => {
  it("shrinks sooner than pickFontSize for the same row count, since category headers cost extra space", () => {
    expect(pickShoppingListFontSize(10, 0)).toBe(11);
    expect(pickShoppingListFontSize(10, 4)).toBe(9); // weighted: 10 + 8 = 18 -> past the 16 boundary
  });

  it("weights each category header as ~2 extra rows", () => {
    expect(pickShoppingListFontSize(8, 1)).toBe(11); // weighted 10
    expect(pickShoppingListFontSize(12, 2)).toBe(10); // weighted 16
    expect(pickShoppingListFontSize(16, 3)).toBe(9); // weighted 22
    expect(pickShoppingListFontSize(20, 5)).toBe(8); // weighted 30
  });

  it("never goes below 8pt no matter how large the list is", () => {
    expect(pickShoppingListFontSize(100, 10)).toBe(8);
  });
});
