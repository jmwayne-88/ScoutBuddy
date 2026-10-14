import { relativeLuminance } from "@/lib/colors";

// WCAG 2.2 contrast ratio between two colors, each given as a 6-digit hex
// string. Ranges from 1 (no contrast) to 21 (black on white).
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastThreshold = "text" | "large-text" | "non-text";

const THRESHOLDS: Record<ContrastThreshold, number> = {
  text: 4.5,
  "large-text": 3,
  "non-text": 3,
};

export function meetsContrast(hexA: string, hexB: string, threshold: ContrastThreshold): boolean {
  return contrastRatio(hexA, hexB) >= THRESHOLDS[threshold];
}
