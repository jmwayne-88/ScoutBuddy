"use client";

import Chip from "@mui/material/Chip";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

// REQ-25.2/25.4-25.6: a purely cosmetic recognition chip, visible only to
// the owning Patrol Leader (callers gate on that), with no ranking or
// cross-patrol comparison anywhere near it. Outlined/primary rather than a
// new filled color: `primary.main` as foreground on the page background is
// already a verified pairing (lib/theme/contrast.test.ts), and both
// `secondary` and `brand.olive` already carry other established meanings
// (a sparing high-emphasis accent, and the Request-Changes/Remove
// secondary-action color) that a streak badge shouldn't borrow.
export function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;

  return (
    <Chip
      variant="outlined"
      color="primary"
      size="small"
      icon={<LocalFireDepartmentIcon fontSize="small" />}
      label={`${streak} campouts in a row, on time!`}
    />
  );
}
