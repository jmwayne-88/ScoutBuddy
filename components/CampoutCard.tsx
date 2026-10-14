"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";

// See components/LinkButton.tsx for why `Link` must be resolved inside a
// client module rather than passed in as a `component` prop value from the
// server-rendered campouts list.
export function CampoutCard({
  href,
  name,
  date,
  imageUrl,
  dotColor,
  percent,
  label,
}: {
  href: string;
  name: string;
  date: string;
  imageUrl: string | null;
  dotColor: string;
  percent: number;
  label: string;
}) {
  return (
    <Paper
      component={Link}
      href={href}
      variant="outlined"
      sx={{
        display: "block",
        p: 1.5,
        textDecoration: "none",
        color: "inherit",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt=""
              width={40}
              height={40}
              sx={{ borderRadius: 1, objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: "brand.darkTan", flexShrink: 0 }} />
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontWeight: 500 }}>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {date}
            </Typography>
          </Box>
          <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: dotColor, flexShrink: 0 }} />
        </Stack>
        <Box>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              borderRadius: 1,
              bgcolor: "brand.lightTan",
              "& .MuiLinearProgress-bar": { bgcolor: dotColor },
            }}
          />
          <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: dotColor }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {percent}%
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
