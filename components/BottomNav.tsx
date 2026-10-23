"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import EventIcon from "@mui/icons-material/Event";
import GroupsIcon from "@mui/icons-material/Groups";
import BadgeIcon from "@mui/icons-material/Badge";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import PrintIcon from "@mui/icons-material/Print";
import type { Actor } from "@/lib/session";

// REQ-23.1: the menu page itself (not its /print sibling, which ADR 0020
// keeps chrome-free) -- matched to build the contextual Print tab's target.
const MENU_PAGE_PATTERN = /^\/menus\/[^/]+$/;

type Destination = { value: string; href: string; label: string; icon: ReactElement };

// REQ-23.1 (third bullet, resolved): role-switching stays header-only
// (components/RoleSwitcher.tsx in the AppBar) rather than duplicated as a
// bottom-bar tab here -- it's a Select control, not a navigation
// destination, and switching role is rare enough not to need a persistent
// one-tap slot in the limited 2-4 item bar. See ADR 0027.
export function BottomNav({ role }: { role: Actor["role"] | null }) {
  const pathname = usePathname();

  if (!role) return null;

  const destinations: Destination[] =
    role === "ASPL"
      ? [
          { value: "/campouts", href: "/campouts", label: "Campouts", icon: <EventIcon fontSize="small" /> },
          { value: "/patrols", href: "/patrols", label: "Manage Patrols", icon: <GroupsIcon fontSize="small" /> },
          // REQ-34.5/34.8: the ASPL's member/invitation page.
          { value: "/unit", href: "/unit", label: "Unit", icon: <BadgeIcon fontSize="small" /> },
        ]
      : [
          {
            value: "/patrol-leader",
            href: "/patrol-leader",
            label: "My Menus",
            icon: <RestaurantMenuIcon fontSize="small" />,
          },
        ];

  // REQ-23.1: Print is contextual -- there's no single "print" destination
  // outside a specific menu, so the tab is omitted everywhere else rather
  // than shown disabled.
  if (role === "PATROL_LEADER" && MENU_PAGE_PATTERN.test(pathname)) {
    destinations.push({ value: "print", href: `${pathname}/print`, label: "Print", icon: <PrintIcon fontSize="small" /> });
  }

  // REQ-23.2: ASPL destinations map directly onto route prefixes. A Patrol
  // Leader only ever has one persistent section ("My Menus," covering both
  // /patrol-leader and every /menus/:id page reached from it) plus the
  // non-selectable Print tab, which navigates away into the chrome-free
  // print route rather than ever being "the current page" itself.
  const current =
    role === "ASPL"
      ? destinations.find((d) => pathname === d.value || pathname.startsWith(`${d.value}/`))?.value
      : "/patrol-leader";

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", sm: "none" },
        zIndex: (theme) => theme.zIndex.appBar,
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      <BottomNavigation showLabels value={current}>
        {destinations.map((d) => (
          <BottomNavigationAction
            key={d.value}
            value={d.value}
            label={d.label}
            icon={d.icon}
            component={Link}
            href={d.href}
            // REQ-23.6: MUI's default sizing already clears 44px here, but
            // pinned explicitly rather than assumed.
            sx={{ minWidth: 44, minHeight: 56 }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
