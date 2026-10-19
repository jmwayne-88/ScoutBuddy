"use client";

import { useState, type ReactNode } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

// REQ-26.4 (resolved Open Question): Resolved threads are hidden by
// default, matching Office's own default -- this toggle reveals them on
// demand. `children` is the already-built thread markup from
// components/CommentThread.tsx (a Server Component); conditionally
// rendering it here is plain children, not a prop MUI clones, so it's
// safe to pass across the Server->Client boundary (see CLAUDE.md).
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
