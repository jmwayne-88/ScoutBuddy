import { describe, expect, it } from "vitest";
import { pickFontSize } from "./print-layout";

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
