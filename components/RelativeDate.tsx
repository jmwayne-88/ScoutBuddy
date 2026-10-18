"use client";

import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import type { RelativeDateValue } from "@/lib/dates";

// REQ-13.9/13.11: renders the output of formatDueDate/formatEventDate —
// the humanized form on screen, the exact calendar date as a tooltip so
// precision is never lost, and an error-token color when overdue.
//
// "use client" (not just plain JSX in the calling Server Component) for the
// same reason components/ReactivateCampoutsDialog.tsx builds its
// Checkbox/FormControlLabel tree client-side: confirmed by running the app, Tooltip clones its single
// child to attach hover/touch handlers, and that clone doesn't survive the
// Server->Client boundary cleanly when the child element was constructed in
// a Server Component -- it throws a hydration mismatch, not a hard crash,
// but still a real one.
export function RelativeDate({ display, absolute, overdue }: RelativeDateValue) {
  return (
    <Tooltip title={absolute}>
      <Box component="span" sx={overdue ? { color: "error.main", fontWeight: 600 } : undefined}>
        {display}
      </Box>
    </Tooltip>
  );
}
