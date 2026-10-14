// Raw Scouting America brand colors, as given on the organization's official
// brand colors sheet (the same source as ADR 0015). `darkBlue` has no
// published RGB/Pantone value in that sheet and should be re-verified against
// the current official brand guide before being treated as authoritative.
//
// These are the only place a Scouting America brand hex value may be
// written literally — every other file reads these via the MUI theme
// (`theme.palette.*` / `theme.palette.brand.*`), never a raw hex/rgb/hsl.
//
// Patrol identity colors (lib/colors.ts) are a separate, pre-existing concept
// (troop-specific, not Scouting America's organizational brand — see ADR
// 0015) and are intentionally not represented here.
export const brandTokens = {
  blue: "#003F87",
  red: "#CE1126",
  tan: "#D6CEBD",
  gray: "#515354",
  white: "#FFFFFF",
  lightTan: "#E9E9E4",
  darkTan: "#AD9D7B",
  paleBlue: "#9AB3D5",
  darkBlue: "#003366",
  paleGray: "#858787",
  darkGray: "#232528",
  // Scouts BSA's secondary action color (ADR 0015) — not part of the primary
  // five-color Scouting America palette above, but an established ScoutBuddy
  // brand token carried forward from the pre-MUI theme.
  olive: "#243E2C",
} as const;

export type BrandToken = keyof typeof brandTokens;
