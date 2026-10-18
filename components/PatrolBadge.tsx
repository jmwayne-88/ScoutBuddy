"use client";

import Chip from "@mui/material/Chip";
import { contrastText } from "@/lib/colors";
import { getPatrolIcon } from "@/lib/patrolIcons";

// REQ-18.4: additive to the existing badge, not a redesign -- `patrol.color`
// still drives the background and `contrastText(patrol.color)` still
// drives both the label and the icon's foreground color. `icon` is a
// plain id string (never a JSX element) so it's always safe to pass in
// from a Server Component caller; this file looks the icon up and builds
// the actual `<Icon />` element for Chip's `icon` prop itself, the same
// pattern `components/MenuStatusChip.tsx` uses for its STATUS_ICONS table
// -- see CLAUDE.md's MUI + Server Components gotcha on why that element
// has to be constructed here, not passed in already-built.
export function PatrolBadge({ name, color, icon }: { name: string; color: string; icon?: string | null }) {
  const iconDef = getPatrolIcon(icon);
  const text = contrastText(color);

  return (
    <Chip
      label={name}
      size="small"
      icon={iconDef ? <iconDef.Icon htmlColor={text} /> : undefined}
      sx={{
        bgcolor: color,
        color: text,
        fontWeight: 500,
        "& .MuiChip-icon": { color: text },
      }}
    />
  );
}
