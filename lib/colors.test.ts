import { describe, expect, it } from "vitest";
import { contrastText, patrolBackground } from "./colors";

describe("patrolBackground", () => {
  it("returns a distinct hex color for each of the four patrols", () => {
    const colors = new Set(
      (["EAGLE", "PUMA", "RAVEN", "SILVER_FOX"] as const).map((p) => patrolBackground(p))
    );
    expect(colors.size).toBe(4);
    for (const color of colors) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("contrastText", () => {
  it("picks black text on light backgrounds", () => {
    expect(contrastText("#ffffff")).toBe("#000000");
    expect(contrastText("#d4af37")).toBe("#000000"); // Puma gold
    expect(contrastText("#9ca3af")).toBe("#000000"); // Silver Fox silver
  });

  it("picks white text on dark backgrounds", () => {
    expect(contrastText("#000000")).toBe("#ffffff");
    expect(contrastText("#1d4ed8")).toBe("#ffffff"); // Eagle blue
    expect(contrastText("#4c1d6b")).toBe("#ffffff"); // Raven dark purple
  });
});
