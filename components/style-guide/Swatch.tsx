import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function Swatch({ name, hex, textColor }: { name: string; hex: string; textColor: string }) {
  return (
    <Box
      sx={{
        bgcolor: hex,
        color: textColor,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        p: 1.5,
        minWidth: 160,
      }}
    >
      <Stack spacing={0.25}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
          {hex}
        </Typography>
      </Stack>
    </Box>
  );
}
