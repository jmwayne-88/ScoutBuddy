"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import CloseIcon from "@mui/icons-material/Close";
import { PATROL_ICONS, suggestPatrolIconId, type PatrolIconCategory } from "@/lib/patrolIcons";

const CATEGORY_LABELS: Record<PatrolIconCategory, string> = {
  animal: "Animals",
  outdoors: "Outdoors & nature",
  gear: "Camping & Scoutcraft gear",
  neutral: "Neutral shapes",
};
const CATEGORY_ORDER: PatrolIconCategory[] = ["animal", "outdoors", "gear", "neutral"];

// REQ-18.2/18.9: a grid picker over the full fixed icon set (REQ-18.8),
// grouped by category since it's intentionally large. `name` drives
// REQ-18.9's live suggestion: as long as the ASPL hasn't explicitly picked
// (or explicitly cleared) an icon themselves -- including the common case
// of editing a patrol that was never given one -- the picker follows
// whatever `suggestPatrolIconId` matches for the current name text as it
// changes. The moment the ASPL clicks any icon (or the "No icon" chip),
// that becomes a real, sticky choice: further edits to the name no longer
// move the selection, and `initialIcon` (an icon already explicitly saved
// on an existing patrol) starts "touched" for the same reason -- REQ-18.9
// is a convenience default, never a silent overwrite of a real choice.
export function PatrolIconField({
  name,
  initialIcon,
  patrolName,
}: {
  name: string;
  initialIcon: string | null;
  patrolName: string;
}) {
  const [icon, setIcon] = useState<string | null>(initialIcon);
  const [touched, setTouched] = useState(initialIcon !== null);

  const suggestedId = useMemo(() => suggestPatrolIconId(patrolName), [patrolName]);
  const selected = touched ? icon : suggestedId;
  const isSuggestion = !touched && suggestedId !== null;

  function choose(id: string | null) {
    setIcon(id);
    setTouched(true);
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Icon (optional)
        </Typography>
        {isSuggestion && <Chip label="Suggested from name" size="small" color="primary" variant="outlined" />}
      </Stack>

      <input type="hidden" name={name} value={selected ?? ""} />

      <Box
        sx={{
          maxHeight: 280,
          overflowY: "auto",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 1.5,
        }}
      >
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              No icon
            </Typography>
            <ToggleButton
              value=""
              selected={selected === null}
              onClick={() => choose(null)}
              size="small"
              aria-label="No icon"
              sx={{ minWidth: 44, minHeight: 44, px: 1.5 }}
            >
              <CloseIcon fontSize="small" />
            </ToggleButton>
          </Box>

          {CATEGORY_ORDER.map((category) => (
            <Box key={category}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                {CATEGORY_LABELS[category]}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                {PATROL_ICONS.filter((i) => i.category === category).map((i) => (
                  <ToggleButton
                    key={i.id}
                    value={i.id}
                    selected={selected === i.id}
                    onClick={() => choose(i.id)}
                    size="small"
                    aria-label={i.label}
                    title={i.label}
                    sx={{ minWidth: 44, minHeight: 44, px: 1.5 }}
                  >
                    <i.Icon fontSize="small" />
                  </ToggleButton>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
