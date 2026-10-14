"use client";

import { useColorScheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();

  // Resolve "system" to whichever scheme is actually in effect, so the
  // button's icon and label reflect what's on screen right now.
  const effective = mode === "system" ? systemMode : mode;

  if (!effective) {
    // Mode is undefined during server rendering (CSS vars pick the right
    // scheme via a media query before hydration) — render a stable
    // placeholder of the same size to avoid layout shift.
    return <IconButton aria-hidden sx={{ visibility: "hidden" }} />;
  }

  return (
    <Tooltip title={effective === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={() => setMode(effective === "dark" ? "light" : "dark")}
        color="inherit"
        aria-label={effective === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {effective === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
