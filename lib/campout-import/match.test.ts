import { describe, expect, it } from "vitest";
import type { Campout } from "@prisma/client";
import { buildMergePreview, matchExistingCampout } from "./match";
import type { RawExtractedCampout } from "./types";

function campout(overrides: Partial<Campout> = {}): Campout {
  return {
    id: "c1",
    name: "Fall Campout",
    date: new Date("2026-10-24"),
    endDate: null,
    location: "Eagle Lake",
    description: "Annual fall trip",
    imageUrl: null,
    lastImportedFrom: null,
    lastImportedAt: null,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function raw(overrides: Partial<RawExtractedCampout> = {}): RawExtractedCampout {
  return { name: "Fall Campout", date: "2026-10-24", endDate: null, location: null, description: null, sourceSections: [1], ...overrides };
}

describe("matchExistingCampout", () => {
  it("matches on exact case-insensitive name and exact date", () => {
    const existing = [campout()];
    expect(matchExistingCampout(raw({ name: "fall campout" }), existing)).toEqual(existing[0]);
  });

  it("matches when the date is within the tolerance window", () => {
    const existing = [campout({ date: new Date("2026-10-25") })];
    expect(matchExistingCampout(raw({ date: "2026-10-24" }), existing)).toEqual(existing[0]);
  });

  it("does not match when the date is outside the tolerance window", () => {
    const existing = [campout({ date: new Date("2026-11-01") })];
    expect(matchExistingCampout(raw({ date: "2026-10-24" }), existing)).toBeNull();
  });

  it("does not match a different name even on the same date", () => {
    const existing = [campout({ name: "Spring Campout" })];
    expect(matchExistingCampout(raw({ name: "Fall Campout" }), existing)).toBeNull();
  });

  it("treats more than one qualifying match as no match -- left for manual review", () => {
    const existing = [campout({ id: "c1" }), campout({ id: "c2" })];
    expect(matchExistingCampout(raw(), existing)).toBeNull();
  });

  it("never matches when the candidate itself has no name or date", () => {
    const existing = [campout()];
    expect(matchExistingCampout(raw({ name: null }), existing)).toBeNull();
    expect(matchExistingCampout(raw({ date: null }), existing)).toBeNull();
  });
});

describe("buildMergePreview", () => {
  it("for a new campout, just passes the raw extraction through with no diff", () => {
    const result = buildMergePreview(raw({ location: "Pine Ridge" }), null);
    expect(result.location).toBe("Pine Ridge");
    expect(result.changedFields).toEqual([]);
  });

  it("the new upload's non-empty value overwrites the existing one", () => {
    const existing = campout({ location: "Old Location" });
    const result = buildMergePreview(raw({ location: "New Location" }), existing);
    expect(result.location).toBe("New Location");
    expect(result.changedFields).toContain("location");
    expect(result.previousValues.location).toBe("Old Location");
  });

  it("a blank/null field in the new upload preserves the existing value", () => {
    const existing = campout({ description: "Existing description" });
    const result = buildMergePreview(raw({ description: null }), existing);
    expect(result.description).toBe("Existing description");
    expect(result.changedFields).not.toContain("description");
  });

  it("flags endDate as changed when the upload adds one the existing campout didn't have", () => {
    const existing = campout({ endDate: null });
    const result = buildMergePreview(raw({ endDate: "2026-10-26" }), existing);
    expect(result.endDate).toBe("2026-10-26");
    expect(result.changedFields).toContain("endDate");
  });
});
