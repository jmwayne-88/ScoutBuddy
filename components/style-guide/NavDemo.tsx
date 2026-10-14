"use client";

import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import MenuIcon from "@mui/icons-material/Menu";
import Box from "@mui/material/Box";

const NAV_ITEMS = ["Campouts", "Patrol Leader", "Style Guide"];

export function NavDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ borderRadius: 1, overflow: "hidden", border: 1, borderColor: "divider" }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1, fontWeight: 800 }}>
            ScoutBuddy
          </Typography>
          <Stack direction="row" spacing={2} sx={{ display: { xs: "none", md: "flex" } }}>
            {NAV_ITEMS.map((item) => (
              <Typography key={item} variant="body2">
                {item}
              </Typography>
            ))}
          </Stack>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <List sx={{ width: 240 }} role="navigation" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <ListItemButton key={item} onClick={() => setOpen(false)}>
              <ListItemText primary={item} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </Box>
  );
}
