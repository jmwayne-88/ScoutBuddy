"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import { contrastText } from "@/lib/colors";

// REQ-20.2/20.3: the color-contrast validation error now renders directly
// on this field instead of a page-level Alert, surfaced via FormHelperText
// (the same themed error-text treatment a TextField's own `error`/
// `helperText` props use) -- there's no TextField here to attach those
// props to, since the picker itself is a native `<input type="color">`.
export function PatrolColorField({
  name,
  defaultValue,
  previewLabel,
  error,
}: {
  name: string;
  defaultValue: string;
  previewLabel: string;
  error?: string | null;
}) {
  const [color, setColor] = useState(defaultValue);

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            Color
          </Typography>
          {/* Native color input: simplest reliable picker, returns a plain
              hex string MUI has no built-in equivalent for. */}
          <input
            type="color"
            name={name}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: 48, height: 36, border: "none", padding: 0, background: "none", cursor: "pointer" }}
          />
        </Stack>
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: color,
            color: contrastText(color),
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {previewLabel || "Preview"}
        </Box>
      </Stack>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Stack>
  );
}
