"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";

// REQ-26.8: a comment-count affordance at a dish/ingredient's own row,
// collapsed by default -- clicking it reveals that target's full
// components/CommentThread.tsx (passed in as `children`, built
// server-side; see components/ResolvedThreadsToggle.tsx for why that's
// safe across the Server->Client boundary here).
export function CommentDisclosure({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Button
        variant="text"
        size="small"
        onClick={() => setOpen((v) => !v)}
        startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
        sx={{ color: "text.secondary", textTransform: "none" }}
      >
        {count > 0 ? `${label} (${count})` : label}
      </Button>
      {open && <Box sx={{ pl: 1, pt: 1 }}>{children}</Box>}
    </Box>
  );
}
