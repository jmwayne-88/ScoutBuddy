import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { getCurrentUser, getSessionStatus } from "@/lib/session";
import { getActivePatrols } from "@/lib/patrols";
import { AccountStatus } from "@/components/AccountStatus";
import { AppNav } from "@/components/AppNav";
import { BottomNav } from "@/components/BottomNav";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ToastListener } from "@/components/ToastListener";
import { UnitSwitcher } from "@/components/UnitSwitcher";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // REQ-31: this layout previously rendered unconditionally even with no
  // actor at all (there was nothing to gate against -- the role picker
  // itself lived at `/` inside this same group). Now that signing in is a
  // real thing, a signed-out visitor is sent to /login instead of seeing
  // an empty-nav shell.
  //
  // REQ-34.8: signed in but no longer in any unit (e.g. just removed from
  // their only one) is a different situation from signed out, with its own
  // page explaining it.
  const user = await getCurrentUser();
  if (!user) {
    redirect((await getSessionStatus()) === "no-unit" ? "/no-unit" : "/login");
  }
  const actor = user.actor;
  const patrols = await getActivePatrols();
  const navItems =
    actor.role === "ASPL"
      ? [
          { href: "/patrols", label: "Manage Patrols" },
          { href: "/unit", label: "Unit Members" },
        ]
      : [];
  const roleLabel =
    actor.role === "ASPL"
      ? "ASPL of Camping"
      : `Patrol Leader — ${patrols.find((p) => p.id === actor.patrolId)?.name ?? "a patrol"}`;

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 0.5 }}>
            ScoutBuddy
          </Typography>
          <AppNav items={navItems} />
          <UnitSwitcher units={user.units} activeUnit={user.activeUnit} />
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <AccountStatus name={user.name} roleLabel={roleLabel} />
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
      <BottomNav role={actor.role} />
      <Suspense fallback={null}>
        <ToastListener />
      </Suspense>
    </>
  );
}
