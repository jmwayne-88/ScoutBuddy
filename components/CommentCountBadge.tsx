"use client";

import Chip from "@mui/material/Chip";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";

// REQ-29.9-29.12: an informational, read-only count -- activating the card
// or list row it sits on still navigates exactly where it always did.
// Nothing renders at zero, so a clear list stays quiet (no "0" chips).
// Default outlined styling only (text.primary / divider), already a
// verified pairing in lib/theme/contrast.test.ts, so no new color token is
// introduced. The count is also the accessible label's subject, not color
// alone, per REQ-29.12.
export function CommentCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  const label = `${count} unresolved comment${count === 1 ? "" : "s"}`;

  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
      label={count}
      aria-label={label}
      title={label}
      sx={{ height: 20, flexShrink: 0, "& .MuiChip-label": { px: 0.75, fontSize: 11 } }}
    />
  );
}
