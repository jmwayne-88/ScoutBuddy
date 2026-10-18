import type { ComponentType, ReactNode } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// REQ-19.2: every "nothing here yet" moment pairs its message with a small
// supporting icon, rendered the same way everywhere via this one shared
// component instead of a one-off layout per page.
export function EmptyState({ icon: Icon, children }: { icon: ComponentType<SvgIconProps>; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      <Icon fontSize="small" sx={{ color: "text.disabled", mt: "2px" }} />
      <Typography variant="body2" color="text.secondary">
        {children}
      </Typography>
    </Stack>
  );
}
