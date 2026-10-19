import type { ReactNode } from "react";
import { Suspense } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { getActor } from "@/lib/session";
import { getActivePatrols } from "@/lib/patrols";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { AppNav } from "@/components/AppNav";
import { BottomNav } from "@/components/BottomNav";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ToastListener } from "@/components/ToastListener";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();
  const patrols = await getActivePatrols();
  const navItems = actor?.role === "ASPL" ? [{ href: "/patrols", label: "Manage Patrols" }] : [];

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 0.5 }}>
            ScoutBuddy
          </Typography>
          <AppNav items={navItems} />
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2" sx={{ opacity: 0.85, display: { xs: "none", sm: "block" } }}>
              Viewing as:
            </Typography>
            <RoleSwitcher actor={actor} patrols={patrols} />
            <ColorModeToggle />
          </Stack>
        </Toolbar>
      </AppBar>
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          pt: { xs: 2, sm: 4 },
          // REQ-23.4: room for the fixed bottom bar on mobile (its ~56px
          // action height plus the home-indicator safe area) so it never
          // overlaps a page's own bottom-of-screen controls (e.g. the menu
          // page's Submit/Approve buttons).
          pb: { xs: "calc(56px + env(safe-area-inset-bottom) + 16px)", sm: 4 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box>{children}</Box>
      </Container>
      <BottomNav role={actor?.role ?? null} />
      <Suspense fallback={null}>
        <ToastListener />
      </Suspense>
    </>
  );
}
