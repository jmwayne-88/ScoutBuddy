"use client";

import type { ReactElement } from "react";
import Chip from "@mui/material/Chip";
import type { MenuStatus } from "@prisma/client";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SendIcon from "@mui/icons-material/Send";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { menuStatusColor } from "@/lib/progress";

// REQ-13.12/13.13: one icon per status, defined once (as a module-level
// table of already-built elements, not components picked by variable name
// at render time -- the latter trips the static-components lint rule and,
// per components/ReactivateCampoutsDialog.tsx's note, doesn't survive
// construction in a Server Component) and reused everywhere a status chip
// is rendered.
const STATUS_ICONS: Record<MenuStatus, ReactElement> = {
  NOT_STARTED: <HourglassEmptyIcon fontSize="small" />,
  IN_PROGRESS: <EditNoteIcon fontSize="small" />,
  SUBMITTED: <SendIcon fontSize="small" />,
  CHANGES_REQUESTED: <RateReviewIcon fontSize="small" />,
  APPROVED: <CheckCircleIcon fontSize="small" />,
};

export function MenuStatusChip({ status, size = "small" }: { status: MenuStatus; size?: "small" | "medium" }) {
  const { bg, text } = menuStatusColor(status);

  return (
    <Chip
      icon={STATUS_ICONS[status]}
      label={status.replace(/_/g, " ")}
      size={size}
      sx={{ bgcolor: bg, color: text, "& .MuiChip-icon": { color: "inherit" } }}
    />
  );
}
