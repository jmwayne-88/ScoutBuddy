import type { PaletteOptions } from "@mui/material/styles";
import { brandTokens } from "./tokens";

// Role assignments below are the subject of ADR 0017, which revises the
// button/background color roles ADR 0015 and ADR 0016 had established
// (brand red as the primary action color, olive as secondary) in favor of
// MUI's primary/secondary slots: primary = Scouting America Blue (buttons,
// AppBar, links — continuing ADR 0016's blue header), secondary = Scouting
// America Red, used sparingly as a high-emphasis accent only, never as the
// general-purpose action color. The pre-existing olive "secondary action"
// meaning (Request Changes, Remove occasion) is preserved as a named
// `palette.brand.olive` token rather than lost.

// Divider: the brand palette's `tan` (#D6CEBD) fails the 3:1 non-text
// contrast check against a white background (measured ~1.56:1). `paleGray`
// (#858787, ~3.6:1) is what the pre-MUI `.card` border already used and is
// what this theme's divider resolves to instead — see lib/theme/contrast.test.ts.
export const lightPalette = {
  mode: "light",
  primary: {
    main: brandTokens.blue,
    dark: brandTokens.darkBlue,
    light: brandTokens.paleBlue,
    contrastText: brandTokens.white,
  },
  secondary: {
    main: brandTokens.red,
    contrastText: brandTokens.white,
  },
  error: {
    // Deliberately distinct from brand red so an error state is never
    // mistaken for a branded accent (verified: 8.18:1 against white).
    main: "#9B1B1B",
    contrastText: brandTokens.white,
  },
  background: {
    default: brandTokens.white,
    paper: brandTokens.white,
  },
  text: {
    primary: brandTokens.darkGray,
    secondary: brandTokens.gray,
    disabled: brandTokens.paleGray,
  },
  divider: brandTokens.paleGray,
  brand: {
    tan: brandTokens.tan,
    lightTan: brandTokens.lightTan,
    darkTan: brandTokens.darkTan,
    paleBlue: brandTokens.paleBlue,
    darkBlue: brandTokens.darkBlue,
    paleGray: brandTokens.paleGray,
    olive: brandTokens.olive,
    oliveDark: "#7FA98C",
  },
} satisfies PaletteOptions;

// Dark scheme notes (each verified in lib/theme/contrast.test.ts):
// - `paper` is a slightly lighter surface than `default`, derived from
//   darkGray rather than published separately by the brand guide.
// - primary = paleBlue (brand blue is too dark to read against a dark
//   background); contrastText is dark, since paleBlue is a light pastel.
// - secondary = a lightened brand red (verified against both the dark
//   background and its own contrastText), not the light-mode #CE1126.
// - error is left unset so MUI supplies its own dark-mode default: the
//   light-mode custom error red (#9B1B1B) fails AA against dark backgrounds
//   (~1.6:1), and MUI's vetted dark error is already visually distinct from
//   both brand red and the dark-mode secondary accent.
// - `brand.olive` keeps its light-mode value for reference/reading, but is
//   unsuitable as a background on dark surfaces (~1.3:1) — components use
//   `brand.oliveDark` (a lightened sage variant, ~5.8:1) for an outlined
//   treatment in dark mode instead of a filled olive background.
export const darkPalette = {
  mode: "dark",
  primary: {
    main: brandTokens.paleBlue,
    contrastText: brandTokens.darkGray,
  },
  secondary: {
    main: "#E57373",
    contrastText: "#000000",
  },
  background: {
    default: brandTokens.darkGray,
    paper: "#2E3033",
  },
  text: {
    primary: brandTokens.white,
    secondary: brandTokens.tan,
  },
  divider: brandTokens.paleGray,
  brand: {
    tan: brandTokens.tan,
    lightTan: brandTokens.lightTan,
    darkTan: brandTokens.darkTan,
    paleBlue: brandTokens.paleBlue,
    darkBlue: brandTokens.darkBlue,
    paleGray: brandTokens.paleGray,
    olive: brandTokens.olive,
    oliveDark: "#7FA98C",
  },
} satisfies PaletteOptions;
