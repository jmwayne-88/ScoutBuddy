import type { GenderDesignation, UnitType } from "@prisma/client";

// REQ-34: pure helpers for a unit's identity -- how it's displayed and how
// user-entered numbers/names are normalized before they're compared for
// uniqueness. Kept free of database access so they're unit-testable, same
// split as lib/session.ts's mapping functions.

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  PACK: "Pack",
  TROOP: "Troop",
  CREW: "Crew",
  SHIP: "Ship",
  POST: "Post",
};

export const GENDER_DESIGNATION_LABELS: Record<GenderDesignation, string> = {
  BOYS: "Boys",
  GIRLS: "Girls",
  FAMILY: "Family",
};

export const MAX_UNIT_NUMBER = 9999;

// REQ-34.12 (and REQ-34.14 for council numbers): a positive whole number
// where leading zeros aren't significant -- "0332" and "332" are the same
// unit. Returns null for anything that isn't digits only, or is out of
// range, rather than guessing.
export function normalizeIdentityNumber(input: string, max: number = MAX_UNIT_NUMBER): number | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) return null;
  return value;
}

// REQ-34.10: what district-name uniqueness within a council is compared
// on -- case- and whitespace-insensitive, so "Pathfinder District" and
// "pathfinder  district" are the same district.
export function normalizeDistrictName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export type UnitIdentity = {
  unitType: UnitType;
  unitNumber: number;
  genderDesignation: GenderDesignation;
};

export type UnitWithHierarchy = UnitIdentity & {
  district: { name: string; council: { number: number; name: string } };
};

// REQ-34.1: the unit's name is always derived, never stored -- e.g.
// "Troop 8 (Boys)".
export function unitDisplayName(unit: UnitIdentity): string {
  return `${UNIT_TYPE_LABELS[unit.unitType]} ${unit.unitNumber} (${GENDER_DESIGNATION_LABELS[unit.genderDesignation]})`;
}

export function councilDisplayName(council: { number: number; name: string }): string {
  return `${council.name} #${council.number}`;
}

// REQ-34.13: anywhere someone chooses among or confirms a unit, type and
// number alone are ambiguous, so district and council always come along.
export function unitFullLabel(unit: UnitWithHierarchy): string {
  return `${unitDisplayName(unit)} · ${unit.district.name} · ${councilDisplayName(unit.district.council)}`;
}

// The Prisma `include` that loads everything unitFullLabel needs, shared so
// every query that feeds it asks for the same shape.
export const UNIT_HIERARCHY_INCLUDE = {
  district: { select: { name: true, council: { select: { number: true, name: true } } } },
} as const;

// REQ-34.4: where switching units lands. A section's list page is the
// "equivalent page" in the new unit; anything below one (/campouts/:id) is
// an id from the old unit, so it goes back to that section's list instead.
// A section the person's role in the new unit can't use, or anywhere
// else, falls back to "/", which routes them to their own landing page.
const SECTIONS_BY_ROLE: Record<"ASPL" | "PATROL_LEADER", string[]> = {
  ASPL: ["/campouts", "/patrols", "/unit"],
  PATROL_LEADER: ["/patrol-leader"],
};

export function pathAfterUnitSwitch(pathname: string, role: "ASPL" | "PATROL_LEADER"): string {
  const section = SECTIONS_BY_ROLE[role].find((s) => pathname === s || pathname.startsWith(`${s}/`));
  return section ?? "/";
}
