"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CheckIcon from "@mui/icons-material/Check";
import type { UnitSummary } from "@/lib/session";
import { switchUnit } from "@/app/(app)/unit/actions";

// REQ-34.4: in the AppBar on every page. Lists only the person's own units
// (the list comes from their memberships, server-side), and switching is
// one action that lands on an equivalent page in the new unit. With just
// one unit there's nothing to switch, so it's a label -- hidden at phone
// width, where the AppBar has no room to spare for something static.
// A client module for the same Tooltip/Menu reason as
// components/RelativeDate.tsx (see CLAUDE.md's MUI + Server Components
// note).
export function UnitSwitcher({ units, activeUnit }: { units: UnitSummary[]; activeUnit: UnitSummary }) {
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [isPending, startTransition] = useTransition();

  if (units.length <= 1) {
    return (
      <Tooltip title={activeUnit.fullLabel}>
        <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: "none", sm: "block" } }}>
          {activeUnit.shortName}
        </Typography>
      </Tooltip>
    );
  }

  function choose(unitId: string) {
    setAnchor(null);
    if (unitId === activeUnit.id) return;
    const formData = new FormData();
    formData.set("unitId", unitId);
    formData.set("pathname", pathname);
    startTransition(() => switchUnit(formData));
  }

  return (
    <>
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <Button
          color="inherit"
          size="small"
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => setAnchor(e.currentTarget)}
          disabled={isPending}
          aria-haspopup="menu"
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {activeUnit.shortName}
        </Button>
      </Box>
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        <IconButton
          color="inherit"
          aria-label={`Switch unit (current: ${activeUnit.fullLabel})`}
          aria-haspopup="menu"
          onClick={(e) => setAnchor(e.currentTarget)}
          disabled={isPending}
        >
          <SwapHorizIcon />
        </IconButton>
      </Box>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {units.map((unit) => (
          // whiteSpace: MenuItem's default nowrap pushed the district/council
          // line off-screen at 360px.
          <MenuItem
            key={unit.id}
            onClick={() => choose(unit.id)}
            selected={unit.id === activeUnit.id}
            sx={{ whiteSpace: "normal", maxWidth: "calc(100vw - 32px)" }}
          >
            <ListItemText primary={unit.shortName} secondary={unit.hierarchyLabel} />
            {unit.id === activeUnit.id && <CheckIcon fontSize="small" sx={{ ml: 2 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
