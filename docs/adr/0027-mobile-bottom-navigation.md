# 0027. Mobile bottom navigation, breakpoint-scoped and header-only role switching

Date: 2026-10-19
Status: Accepted

## Context

[Requirement 23](../requirements/ux-interaction-polish/23-mobile-bottom-navigation.md) asks for a persistent, always-one-tap navigation bar on mobile viewports — today, `components/AppNav.tsx` renders at most one destination ("Manage Patrols," ASPL-only) as either an inline header link (`md` and up) or a hamburger-triggered `Drawer` (below `md`); a Patrol Leader has no persistent navigation at all on a phone-width viewport, the primary device the app's actual users (youth leaders, on the go) are expected to use.

Two decisions had to be made that the requirement left open:

1. **Which breakpoint the bottom bar replaces.** `AppNav`'s existing drawer/inline split happens at `md` (900px), not `sm` (600px), but REQ-23.1/23.3 specify the bar only for viewports below `sm` and require that navigation at `sm` and above be unchanged.
2. **Where role-switching lives.** REQ-23.1's third bullet requires an explicit decision: duplicate `components/RoleSwitcher.tsx`'s role change into the bottom bar, or leave it header-only.

## Decision

- The bottom bar (`components/BottomNav.tsx`, MUI `BottomNavigation`) renders only below the theme's `sm` breakpoint (600px). `AppNav.tsx`'s hamburger drawer is narrowed from `{ xs: "block", md: "none" }` to `{ xs: "none", sm: "block", md: "none" }` — retired exactly where the bottom bar now covers its one destination, but otherwise untouched: the `sm`-`md` range still gets the drawer, `md`+ still gets the inline links, neither changed by this requirement.
- Role-switching stays header-only. `RoleSwitcher` is a `Select` dropdown, not a link to a destination, and doesn't fit a `BottomNavigationAction`'s tap-a-tab-to-navigate model without either a dialog-opening fourth tab (adding UI for a rarely-used action) or an awkward inline `Select` squeezed into the bar. Switching role is infrequent enough — not a per-visit action like checking menus or reviewing — that one reachable control (the AppBar) is enough; it isn't duplicated here.
- Destinations are role-scoped and computed client-side in `BottomNav` from `usePathname()`: ASPL gets Campouts (`/campouts`) and Manage Patrols (`/patrols`); Patrol Leader gets My Menus (`/patrol-leader`) plus a contextual Print tab, shown only while viewing a specific menu (`/menus/:id`) and omitted everywhere else, since there's no single "print" destination outside that context.
- `app/(app)/layout.tsx`'s `Container` gains bottom padding on `xs` (`calc(56px + env(safe-area-inset-bottom) + 16px)`) so the fixed bar never overlaps a page's own bottom controls (e.g. the menu page's Submit/Approve buttons), and `components/ToastListener.tsx`'s `Snackbar` gets the same offset so a toast doesn't render underneath the bar. The root layout (`app/layout.tsx`) now sets `viewport: { viewportFit: "cover" }`, without which `env(safe-area-inset-bottom)` always resolves to `0` and the bar would sit under, not above, a notched phone's home indicator.

## Alternatives Considered

- **Switch the drawer/inline breakpoint to `sm` everywhere, not just retire the drawer below it**: would make the bottom bar's replacement boundary and the existing header nav's boundary the same breakpoint, arguably more consistent. Rejected because REQ-23.3 explicitly scopes this requirement to leaving `sm`+ behavior unchanged — moving the existing `md` split would be an unrelated navigation change bundled into a mobile-only requirement.
- **Fourth "Role" tab opening a bottom sheet/dialog with the same role choices**: keeps all navigation in one place and gives role-switching a persistent mobile-reachable slot. Rejected for now: it's extra surface area (a new dialog, not just a reused control) for an action used a handful of times per session at most, in a bar that's supposed to stay to "2-4 destinations" the requirement treats as primary.
- **Keep the hamburger drawer everywhere below `md` and add the bottom bar alongside it**: avoids touching `AppNav.tsx` at all. Rejected — showing two different navigation affordances (a persistent bottom bar and a hamburger drawer that opens the exact same "Manage Patrols" link) on the same `xs` viewport is confusing, and REQ-23.5 explicitly calls for retiring the drawer once the bar covers its destination.

## Consequences

- A future ASPL or Patrol Leader destination needs a decision about whether it belongs in the bottom bar's 2-4 slots (and, if so, which existing one it might replace or combine with) — this isn't automatic the way adding a header link was.
- If role-switching frequency turns out higher in real troop use than assumed here (e.g. a shared device handed between multiple Patrol Leaders at a single sitting), this decision should be revisited; it isn't a one-way door, since `RoleSwitcher` itself doesn't change.
- Every `app/(app)/` page's bottom-of-screen content must stay clear of the reserved `xs` padding — a page that sets its own fixed-position bottom element outside the `Container` (none do today) would need the same safe-area treatment `BottomNav`/`ToastListener` use.

## Related

- [Requirement 23 - Persistent Mobile Bottom Navigation](../requirements/ux-interaction-polish/23-mobile-bottom-navigation.md)
- [Requirement 7 - Campout Dashboard Layout & Status Visualization](../requirements/ux-interaction-polish/07-campout-dashboard-layout.md) — REQ-7.4 moved the role switcher into the header in the first place.
- [ADR 0020 - Print view route group and padding-as-margin pagination](0020-print-view-route-group-and-pagination.md) — why the print route group never renders this bar (or any chrome) at all.
- [ADR 0017 - Adopt MUI as the design system](0017-adopt-mui-design-system.md) — `BottomNav` is built on MUI's `BottomNavigation`/`BottomNavigationAction`, consistent with "MUI is the only component library."
