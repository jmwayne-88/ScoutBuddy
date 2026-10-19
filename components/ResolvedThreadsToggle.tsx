"use client";

import { useState, type ReactNode } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

// REQ-26.4 (resolved Open Question): Resolved threads are hidden by
// default, matching Office's own default -- this toggle reveals them on
// demand, inside components/CommentPane.tsx's side pane.
export function ResolvedThreadsToggle({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={1}>
      <Button variant="text" size="small" onClick={() => setOpen((v) => !v)} sx={{ alignSelf: "flex-start" }}>
        {open ? "Hide resolved" : `Show resolved (${count})`}
      </Button>
      {open && children}
    </Stack>
  );
}
