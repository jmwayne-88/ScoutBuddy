"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MuiLink from "@mui/material/Link";
import MenuIcon from "@mui/icons-material/Menu";

type NavItem = { href: string; label: string };

// See components/NavLink.tsx for why `Link` is resolved inside this client
// module rather than passed in as a prop. `items` here is plain data, not a
// JSX element, so passing it in from a Server Component is unaffected.
export function AppNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
        {items.map((item) => (
          <MuiLink key={item.href} component={Link} href={item.href} color="inherit" underline="hover">
            {item.label}
          </MuiLink>
        ))}
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <IconButton color="inherit" aria-label="Open navigation" onClick={() => setOpen(true)}>
          <MenuIcon />
        </IconButton>
        <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
          <List sx={{ width: 240 }}>
            {items.map((item) => (
              <ListItemButton key={item.href} component={Link} href={item.href} onClick={() => setOpen(false)}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      </Box>
    </>
  );
}
