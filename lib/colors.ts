function srgbToLinear(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16) / 255;
  const g = parseInt(value.substring(2, 4), 16) / 255;
  const b = parseInt(value.substring(4, 6), 16) / 255;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

// WCAG-relative-luminance threshold that roughly balances contrast between
// black and white text against an arbitrary background. Patrol colors are
// now admin-entered, free-form data (Requirement 8) — this rough heuristic
// is only used to *pick* a text color; lib/theme/contrast.ts's meetsContrast
// is what actually validates a chosen patrol color passes WCAG before it's
// allowed to be saved (see app/patrols/actions.ts).
export function contrastText(hex: string): "#000000" | "#ffffff" {
  return relativeLuminance(hex) > 0.179 ? "#000000" : "#ffffff";
}
