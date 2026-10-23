import { describe, expect, it } from "vitest";
import { safeNextPath } from "./redirects";

describe("safeNextPath", () => {
  it("keeps a same-site path", () => {
    expect(safeNextPath("/invite/abc123")).toBe("/invite/abc123");
  });

  it("falls back to / for anything that could leave the site", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("invite/abc")).toBe("/");
  });

  it("falls back to / when missing", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});
