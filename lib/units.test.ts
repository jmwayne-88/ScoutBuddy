import { describe, expect, it } from "vitest";
import {
  normalizeDistrictName,
  normalizeIdentityNumber,
  pathAfterUnitSwitch,
  unitDisplayName,
  unitFullLabel,
} from "./units";

describe("normalizeIdentityNumber", () => {
  it("treats leading zeros as insignificant", () => {
    expect(normalizeIdentityNumber("0332")).toBe(332);
    expect(normalizeIdentityNumber("332")).toBe(332);
    expect(normalizeIdentityNumber(" 8 ")).toBe(8);
  });

  it("accepts the full 1-9999 range and nothing outside it", () => {
    expect(normalizeIdentityNumber("1")).toBe(1);
    expect(normalizeIdentityNumber("9999")).toBe(9999);
    expect(normalizeIdentityNumber("0")).toBeNull();
    expect(normalizeIdentityNumber("0000")).toBeNull();
    expect(normalizeIdentityNumber("10000")).toBeNull();
  });

  it("rejects anything that isn't digits only", () => {
    expect(normalizeIdentityNumber("")).toBeNull();
    expect(normalizeIdentityNumber("-5")).toBeNull();
    expect(normalizeIdentityNumber("3.5")).toBeNull();
    expect(normalizeIdentityNumber("332B")).toBeNull();
    expect(normalizeIdentityNumber("1e3")).toBeNull();
  });

  it("honors a custom maximum", () => {
    expect(normalizeIdentityNumber("433", 999)).toBe(433);
    expect(normalizeIdentityNumber("1000", 999)).toBeNull();
  });
});

describe("normalizeDistrictName", () => {
  it("is case- and whitespace-insensitive", () => {
    expect(normalizeDistrictName("Pathfinder District")).toBe("pathfinder district");
    expect(normalizeDistrictName("  pathfinder   DISTRICT ")).toBe("pathfinder district");
  });
});

describe("unit labels", () => {
  const troop = {
    unitType: "TROOP" as const,
    unitNumber: 8,
    genderDesignation: "BOYS" as const,
    district: { name: "Buckeye District", council: { number: 433, name: "Great Trail Council" } },
  };

  it("derives the display name from type, number, and designation", () => {
    expect(unitDisplayName(troop)).toBe("Troop 8 (Boys)");
    expect(unitDisplayName({ unitType: "PACK", unitNumber: 332, genderDesignation: "FAMILY" })).toBe(
      "Pack 332 (Family)"
    );
  });

  it("always includes district and council in the full label", () => {
    expect(unitFullLabel(troop)).toBe("Troop 8 (Boys) · Buckeye District · Great Trail Council #433");
  });
});

describe("pathAfterUnitSwitch", () => {
  it("keeps a section list page the new role can use", () => {
    expect(pathAfterUnitSwitch("/campouts", "ASPL")).toBe("/campouts");
    expect(pathAfterUnitSwitch("/patrol-leader", "PATROL_LEADER")).toBe("/patrol-leader");
  });

  it("never stays on a page for one of the old unit's records", () => {
    expect(pathAfterUnitSwitch("/campouts/abc123", "ASPL")).toBe("/campouts");
    expect(pathAfterUnitSwitch("/patrols/abc123/edit", "ASPL")).toBe("/patrols");
  });

  it("sends a section the new role can't use to the landing page", () => {
    expect(pathAfterUnitSwitch("/campouts", "PATROL_LEADER")).toBe("/");
    expect(pathAfterUnitSwitch("/menus/abc123", "PATROL_LEADER")).toBe("/");
  });

  it("doesn't mistake a prefix for a section", () => {
    expect(pathAfterUnitSwitch("/campouts-archive", "ASPL")).toBe("/");
  });
});
