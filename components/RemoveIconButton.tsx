"use client";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-16.2/16.3/16.8: one icon button for every "remove" row action (a
// dish, an ingredient), so they share the same icon, sizing, and Tooltip
// treatment rather than each page re-implementing its own.
//
// "use client" for the same reason components/RoleForm.tsx builds its
// Radio/FormControlLabel tree client-side: confirmed by running the app,
// Tooltip clones its child to attach hover/touch handlers, which doesn't
// survive the Server->Client boundary cleanly when that child is
// constructed in a Server Component -- see CLAUDE.md's MUI + Server
// Components gotcha. The menu page (a Server Component) only passes in
// plain data (`label`, `hiddenFields`) and a Server Action reference
// (`action`, safely serializable), never JSX.
//
// `formId`, when given, lets components/SwipeableRow.tsx trigger this same
// removal via `document.getElementById(formId)?.requestSubmit()` on a
// large swipe (REQ-16.6), instead of requiring a precise tap.
export function RemoveIconButton({
  label,
  action,
  hiddenFields,
  formId,
}: {
  label: string;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  formId?: string;
}) {
  return (
    <Box component="form" id={formId} action={action} sx={{ display: "inline-flex" }}>
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <Tooltip title={label}>
        <SubmitButton iconOnly aria-label={label} sx={{ minWidth: 44, minHeight: 44 }}>
          <DeleteIcon fontSize="small" />
        </SubmitButton>
      </Tooltip>
    </Box>
  );
}
