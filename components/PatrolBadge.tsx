import Chip from "@mui/material/Chip";
import { contrastText } from "@/lib/colors";

export function PatrolBadge({ name, color }: { name: string; color: string }) {
  return (
    <Chip
      label={name}
      size="small"
      sx={{
        bgcolor: color,
        color: contrastText(color),
        fontWeight: 500,
      }}
    />
  );
}
