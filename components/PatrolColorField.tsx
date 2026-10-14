"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { contrastText } from "@/lib/colors";

export function PatrolColorField({
  name,
  defaultValue,
  previewLabel,
}: {
  name: string;
  defaultValue: string;
  previewLabel: string;
}) {
  const [color, setColor] = useState(defaultValue);

  return (
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
  );
}
