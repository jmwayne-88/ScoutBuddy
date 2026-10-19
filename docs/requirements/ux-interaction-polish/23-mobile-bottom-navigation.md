# Requirement 23 — Persistent Mobile Bottom Navigation

Status: Done
Depends on: none tied to a single ROADMAP iteration; restructures navigation established in [Requirement 7](07-campout-dashboard-layout.md)'s REQ-7.4 (role switcher moved into the header) and `components/AppNav.tsx`

## Goal

Give the app a persistent bottom tab bar on mobile viewports, with the current role's primary destinations always one tap away, instead of today's single conditional "Manage Patrols" link plus a hamburger drawer — closer to the navigation model this app's audience expects from the consumer apps they use daily.

## Source

Recommendation #18 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section.

## Problem

`components/AppNav.tsx` currently renders at most one nav item ("Manage Patrols," shown only to the ASPL) as either an inline header link (`md` and up) or a hamburger-triggered `Drawer` (below `md`). A Patrol Leader has no persistent navigation at all beyond the header's role switcher and whatever `NavLink`s happen to be on the current page (e.g. "Print preview," the menu page's "Close" button). On a phone-width viewport — the primary device for a youth leader actually using this app on the go — there is no always-visible way to jump between "my menu" and other relevant destinations without finding an in-page link first.

## Requirements

- **REQ-23.1** On viewports below the theme's `sm` breakpoint, a fixed bottom navigation bar (MUI `BottomNavigation`) renders persistently across every `app/(app)/` route, showing 2-4 destinations scoped to the current role:
  - **ASPL**: Campouts (`/campouts`), Manage Patrols (`/patrols`).
  - **Patrol Leader**: My Menus (`/patrol-leader`), Print (contextual — only enabled/shown when viewing a specific menu; otherwise omitted or disabled, since there's no single "print" destination outside a menu context).
  - Both roles: a way to change role, equivalent to today's header `RoleSwitcher` — either a third tab opening that same control, or an explicit decision (documented inline in this requirement's implementation) to leave role-switching header-only and keep the bottom bar to role-specific destinations only.
- **REQ-23.2** The bottom bar highlights the current destination (MUI `BottomNavigationAction`'s built-in selected state), matching it against the current route via `usePathname()`.
- **REQ-23.3** At `sm` and above, the bottom bar does not render — today's header-based navigation (`components/AppNav.tsx`'s inline links) remains the desktop/tablet pattern; this requirement does not change navigation above the `sm` breakpoint.
- **REQ-23.4** The app's main content area (`app/(app)/layout.tsx`'s `Container`) gains bottom padding/`safe-area-inset-bottom` awareness on mobile so the fixed bottom bar never overlaps or hides content or a page's own bottom-of-screen controls (e.g. the menu page's Submit/Approve buttons).
- **REQ-23.5** `components/AppNav.tsx`'s existing hamburger-drawer pattern is retired on mobile once the bottom bar covers its one current destination ("Manage Patrols"); if the drawer still has value for secondary/less-frequent links as the app grows, that's a separate future decision, not assumed by this requirement.
- **REQ-23.6** Every bottom-bar tab meets the theme's 44×44px minimum touch target (MUI's default `BottomNavigationAction` sizing already tends to satisfy this, but must be verified, not assumed).

## Acceptance Criteria

- [ ] At 360px width, a persistent bottom navigation bar is visible on every `app/(app)/` page, showing destinations appropriate to the current role.
- [ ] The current page's corresponding tab is visually highlighted.
- [ ] At 1440px width, no bottom navigation bar renders; the existing header navigation is unchanged.
- [ ] No page's own bottom-of-screen content (e.g. Submit/Approve buttons) is hidden or overlapped by the bottom bar on mobile.
- [ ] Switching role from the bottom bar (if REQ-23.1 implements that option) correctly updates `components/RoleSwitcher.tsx`'s displayed state too — there is still only one underlying role, however many controls can change it.

## Out of Scope for This Requirement

- Any new destination beyond what the app already has routes for (`/campouts`, `/patrols`, `/patrol-leader`, menu print) — this requirement is about navigation chrome, not new pages.
- Changing desktop/tablet (`sm`+) navigation in any way.
- A persistent bottom bar on the print route group — per [ADR 0020](../adr/0020-print-view-route-group-and-pagination.md), that route deliberately carries no app chrome at all.

## Related

- [Requirement 7 - Campout Dashboard Layout & Status Visualization](07-campout-dashboard-layout.md) — REQ-7.4 moved the role switcher into the header; this requirement must decide (REQ-23.1's third bullet) whether mobile navigation duplicates or defers to that control.
- `components/AppNav.tsx` — the existing navigation component this requirement's mobile behavior replaces.
- [ADR 0020 - Print view route group and pagination](../adr/0020-print-view-route-group-and-pagination.md) — why the print route stays excluded.
