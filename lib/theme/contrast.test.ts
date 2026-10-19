import { describe, expect, it } from "vitest";
import { contrastRatio, type ContrastThreshold } from "./contrast";
import { lightPalette, darkPalette } from "./palette";
import { menuStatusColor } from "@/lib/progress";

type Pairing = {
  name: string;
  foreground: string;
  background: string;
  threshold: ContrastThreshold;
};

function req<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("expected palette value to be defined");
  return value;
}

const lightBg = req(lightPalette.background?.default);
const lightPaper = req(lightPalette.background?.paper);
const darkBg = req(darkPalette.background?.default);
const darkPaper = req(darkPalette.background?.paper);

// Every foreground/background pairing the theme actually renders, per
// REQ-9.13 (docs/requirements/09-adopt-mui-design-system.md). `text.disabled`
// is deliberately excluded from the WCAG assertions below — disabled
// controls are exempt from the 4.5:1 text requirement — but is still logged
// in the results table for visibility.
const pairings: Pairing[] = [
  // Light scheme
  { name: "light: primary contrastText on primary.main", foreground: req(lightPalette.primary?.contrastText), background: req(lightPalette.primary?.main), threshold: "text" },
  { name: "light: secondary contrastText on secondary.main", foreground: req(lightPalette.secondary?.contrastText), background: req(lightPalette.secondary?.main), threshold: "text" },
  { name: "light: error contrastText on error.main", foreground: req(lightPalette.error?.contrastText), background: req(lightPalette.error?.main), threshold: "text" },
  { name: "light: text.primary on background.default", foreground: req(lightPalette.text?.primary), background: lightBg, threshold: "text" },
  { name: "light: text.secondary on background.default", foreground: req(lightPalette.text?.secondary), background: lightBg, threshold: "text" },
  { name: "light: text.primary on brand.lightTan (background.subtle)", foreground: req(lightPalette.text?.primary), background: req(lightPalette.brand?.lightTan), threshold: "text" },
  { name: "light: divider on background.default (non-text)", foreground: req(lightPalette.divider), background: lightBg, threshold: "non-text" },
  { name: "light: white on brand.olive (secondary-action button)", foreground: "#FFFFFF", background: req(lightPalette.brand?.olive), threshold: "text" },
  { name: "light: primary.main as link color on background.default", foreground: req(lightPalette.primary?.main), background: lightBg, threshold: "text" },

  // Dark scheme
  { name: "dark: primary contrastText on primary.main", foreground: req(darkPalette.primary?.contrastText), background: req(darkPalette.primary?.main), threshold: "text" },
  { name: "dark: secondary contrastText on secondary.main", foreground: req(darkPalette.secondary?.contrastText), background: req(darkPalette.secondary?.main), threshold: "text" },
  { name: "dark: text.primary on background.default", foreground: req(darkPalette.text?.primary), background: darkBg, threshold: "text" },
  { name: "dark: text.secondary on background.default", foreground: req(darkPalette.text?.secondary), background: darkBg, threshold: "text" },
  { name: "dark: text.primary on background.paper", foreground: req(darkPalette.text?.primary), background: darkPaper, threshold: "text" },
  { name: "dark: divider on background.default (non-text)", foreground: req(darkPalette.divider), background: darkBg, threshold: "non-text" },
  { name: "dark: brand.oliveDark on background.default (outlined secondary-action)", foreground: req(darkPalette.brand?.oliveDark), background: darkBg, threshold: "text" },
  // REQ-25.6: components/StreakBadge.tsx's outlined chip uses primary.main
  // as its text/icon color directly on the page background.
  { name: "dark: primary.main on background.default (streak badge)", foreground: req(darkPalette.primary?.main), background: darkBg, threshold: "text" },

  // Semantic status colors (lib/progress.ts) — unchanged by this migration,
  // re-verified here since Requirement 9 touches every pairing the app renders.
  { name: "status: NOT_STARTED text on bg", foreground: menuStatusColor("NOT_STARTED").text, background: menuStatusColor("NOT_STARTED").bg, threshold: "text" },
  { name: "status: IN_PROGRESS text on bg", foreground: menuStatusColor("IN_PROGRESS").text, background: menuStatusColor("IN_PROGRESS").bg, threshold: "text" },
  { name: "status: SUBMITTED text on bg", foreground: menuStatusColor("SUBMITTED").text, background: menuStatusColor("SUBMITTED").bg, threshold: "text" },
  { name: "status: CHANGES_REQUESTED text on bg", foreground: menuStatusColor("CHANGES_REQUESTED").text, background: menuStatusColor("CHANGES_REQUESTED").bg, threshold: "text" },
  { name: "status: APPROVED text on bg", foreground: menuStatusColor("APPROVED").text, background: menuStatusColor("APPROVED").bg, threshold: "text" },
];

const infoOnly: Pairing[] = [
  { name: "light: text.disabled on background.default (disabled, exempt)", foreground: req(lightPalette.text?.disabled), background: lightBg, threshold: "text" },
];

const THRESHOLD_MIN: Record<ContrastThreshold, number> = { text: 4.5, "large-text": 3, "non-text": 3 };

describe("theme contrast", () => {
  const results = [...pairings, ...infoOnly].map((p) => ({
    pairing: p.name,
    ratio: contrastRatio(p.foreground, p.background),
    threshold: `${THRESHOLD_MIN[p.threshold]}:1 (${p.threshold})`,
  }));

  it("passes WCAG 2.2 AA for every pairing the theme renders", () => {
    console.table(results.map((r) => ({ ...r, ratio: r.ratio.toFixed(2) })));

    for (const p of pairings) {
      const ratio = contrastRatio(p.foreground, p.background);
      expect(ratio, `${p.name} (${p.foreground} on ${p.background})`).toBeGreaterThanOrEqual(THRESHOLD_MIN[p.threshold]);
    }
  });

  it("documents light/lightPaper equal to light background.default (no separate paper surface)", () => {
    expect(lightPaper).toBe(lightBg);
  });
});
