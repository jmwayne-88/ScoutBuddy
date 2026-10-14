import type { MenuStatus } from "@prisma/client";

// Semantic status colors — distinct from the Scouts BSA brand chrome in
// ADR 0015 (which governs buttons/backgrounds/links, not status indicators).
// See ADR 0016.
// Text colors are chosen per-background, not uniformly white — #858787 and
// #b8860b are too light for white text to reach the WCAG 4.5:1 text
// threshold (verified in lib/theme/contrast.test.ts, which caught this).
const STATUS_COLORS: Record<MenuStatus, { bg: string; text: string }> = {
  NOT_STARTED: { bg: "#858787", text: "#000000" }, // gray
  IN_PROGRESS: { bg: "#003f87", text: "#ffffff" }, // blue
  SUBMITTED: { bg: "#b8860b", text: "#000000" }, // amber
  CHANGES_REQUESTED: { bg: "#6b2d8c", text: "#ffffff" }, // purple
  APPROVED: { bg: "#1e7a3c", text: "#ffffff" }, // green
};

export function menuStatusColor(status: MenuStatus): { bg: string; text: string } {
  return STATUS_COLORS[status];
}

export type CampoutProgress = {
  approved: number;
  total: number;
  percent: number;
  label: string;
  dotColor: string;
};

// `totalPatrols` is the count of currently-active patrols, queried by the
// caller (lib/patrols.ts) — patrols are admin-managed data now (Requirement
// 8), not a fixed compile-time list, so this can no longer be a constant.
export function campoutProgress(menuStatuses: MenuStatus[], totalPatrols: number): CampoutProgress {
  const total = totalPatrols;
  const approved = menuStatuses.filter((s) => s === "APPROVED").length;
  const changesRequested = menuStatuses.filter((s) => s === "CHANGES_REQUESTED").length;
  const submitted = menuStatuses.filter((s) => s === "SUBMITTED").length;
  const percent = total === 0 ? 0 : Math.round((approved / total) * 100);

  let label: string;
  let dotColor: string;

  if (changesRequested > 0) {
    label = `${changesRequested} Needs Revision`;
    dotColor = STATUS_COLORS.CHANGES_REQUESTED.bg;
  } else if (submitted > 0) {
    label = `${submitted} Awaiting Review`;
    dotColor = STATUS_COLORS.SUBMITTED.bg;
  } else if (approved === total && total > 0) {
    label = "All Approved";
    dotColor = STATUS_COLORS.APPROVED.bg;
  } else if (menuStatuses.some((s) => s === "IN_PROGRESS" || s === "APPROVED")) {
    label = "In Progress";
    dotColor = STATUS_COLORS.IN_PROGRESS.bg;
  } else {
    label = "Not Started";
    dotColor = STATUS_COLORS.NOT_STARTED.bg;
  }

  return { approved, total, percent, label, dotColor };
}

export function menuDishCount(meals: { dishes: unknown[] }[]): number {
  return meals.reduce((sum, meal) => sum + meal.dishes.length, 0);
}
