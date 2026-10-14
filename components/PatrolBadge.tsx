import Chip from "@mui/material/Chip";
import type { Patrol } from "@prisma/client";
import { contrastText, patrolBackground } from "@/lib/colors";
import { patrolLabel } from "@/lib/constants";

export function PatrolBadge({ patrol }: { patrol: Patrol }) {
  const background = patrolBackground(patrol);
  return (
    <Chip
      label={patrolLabel(patrol)}
      size="small"
      sx={{
        bgcolor: background,
        color: contrastText(background),
        fontWeight: 500,
      }}
    />
  );
}
