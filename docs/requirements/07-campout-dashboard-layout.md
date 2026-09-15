# Requirement 7 — Campout Dashboard Layout & Status Visualization

Status: Not started
Depends on: Requirements 1-5 (uses existing campout/menu/patrol data as-is); refines the header/status color choices made in [ADR 0015](../adr/0015-brand-aligned-visual-design.md)

## Goal

Restructure the ASPL's campout views from today's simple stacked pages into a persistent two-panel dashboard — a campout list alongside a detail panel — with richer, at-a-glance visual status communication (progress bars, color-coded status pills, per-patrol dish counts), matching a reference screenshot the user provided. This is a presentation-layer requirement: the underlying data, permissions, and approval workflow (ADRs 0006, 0007, 0012, 0013) do not change.

## Source

A reference screenshot supplied by the user: a "Scout Buddy" dashboard with a left sidebar listing campouts (thumbnail, name, date, status dot, progress bar) and a main panel showing the selected campout's hero image, description, overall progress, and a 2x2 grid of patrol cards (status pill, due date, dish count, action buttons).

## Requirements

### Layout

- **REQ-7.1** The ASPL's campout list and the selected campout's detail render together in one persistent two-panel layout (sidebar + main panel), not as separate full-page navigations requiring a back button.
- **REQ-7.2** The sidebar lists every campout with its name, date, a status dot, and a progress bar/percentage; the currently-open campout is visually highlighted (e.g., an accent border/background).
- **REQ-7.3** Selecting a campout in the sidebar updates the main panel. A standard Next.js route change between campouts (as today) satisfies this as long as the sidebar persists across the navigation — a client-side SPA rewrite is not required by this requirement.
- **REQ-7.4** The role switcher moves from the dedicated `/` page into a compact dropdown in the header ("Viewing as: [role] ▾"), so switching roles doesn't require leaving the current page. The full role-picker page may remain as a fallback for the very first visit, before any role cookie is set.

### New campout fields

- **REQ-7.5** Campout gains an optional **location** field (free text, e.g., "Eagle Lake, Pine Ridge"), settable by the ASPL when creating or editing a campout.
- **REQ-7.6** Campout gains an optional **description** field (free text, e.g., "A weekend of wilderness survival skills..."), shown on the detail panel.
- **REQ-7.7 (optional/stretch)** Campout may have a representative photo, shown as a hero image on the detail panel and a thumbnail in the sidebar. No image-hosting capability exists yet — whether this is a plain pasted image URL versus real file upload/storage is a separate decision to make at implementation time, not settled here. Layout must degrade cleanly with no photo set, since most campouts won't have one at first.

### Status & progress visualization

- **REQ-7.8** Each menu status (Not Started, In Progress, Submitted, Changes Requested, Approved) has one consistent color for its status pill everywhere a status is shown (sidebar, patrol cards, menu detail page). These are semantic/functional status colors — a standard, expected UX convention — independent of patrol identity colors, and not required to be drawn from the Scouts BSA brand palette the way chrome/buttons are under ADR 0015.
- **REQ-7.9** A campout-level progress summary (e.g., "1/4 approved," a percentage, a progress bar) reflects how many of its four patrol menus are Approved, computed from existing menu statuses — no new stored field.
- **REQ-7.10** Each patrol card shows a computed "X dishes planned" count — the total dishes across that menu's active occasions, computed from existing data.
- **REQ-7.11** The sidebar's per-campout progress bar and the detail panel's campout-level progress summary use the same underlying calculation, defined once — not two independent metrics that could disagree.

### Patrol cards

- **REQ-7.12** Each of the four patrols renders as a card: its existing patrol color as a header band, a status pill, due date, and dish count — the same information the current per-patrol rows show, restyled as cards.
- **REQ-7.13 (optional/stretch)** A small illustrated mascot/avatar per patrol, as in the reference screenshot. Requires original artwork — not a reproduction of any Scouting America trademark or protected program emblem, per the same constraint established in ADR 0015. No such artwork exists yet; a plain colored header band (today's look) is an acceptable fallback if this isn't pursued.
- **REQ-7.14 (optional/stretch)** A "Print" action per patrol menu producing a print-friendly view. Entirely new scope, not implied by any earlier requirement.
- **REQ-7.15** The reference's "Edit Assignment" / "View" buttons map onto existing actions: "Edit Assignment" for the ASPL adjusting a menu's due date (and, per Iteration 4, meal-framework exceptions); "View" for opening the menu itself. Exact button set and copy to be finalized at implementation time.

## Acceptance Criteria

- [ ] The ASPL's campouts area shows the sidebar and detail panel together, not as two separate pages requiring back-navigation.
- [ ] Every place a menu's status appears uses the same color for that status.
- [ ] A campout with four assigned menus of differing statuses shows a campout-level progress summary matching the actual counts.
- [ ] A patrol card's dish count matches the actual number of dishes on that menu.
- [ ] Switching roles works from the header dropdown without navigating to a separate page.
- [ ] A campout with no photo, location, or description set still renders cleanly — no broken image icons, no awkward empty gaps.
- [ ] No official Scouting America logo, trademark, or protected program emblem appears anywhere in the new layout — carried forward from ADR 0015.

## Out of Scope for This Requirement

- Real photo upload/hosting infrastructure — deferred as a separate decision (see REQ-7.7).
- Custom mascot illustrations — optional, see REQ-7.13.
- Print/export functionality — optional, see REQ-7.14; if pursued seriously (pagination, formatting) it likely deserves its own requirement rather than being folded into this one.
- Any change to the underlying approval workflow, permissions, or status lifecycle — this requirement is presentation-only.

## Related

- [ADR 0015 - Brand-aligned visual design](../adr/0015-brand-aligned-visual-design.md) — this requirement refines its header-color and status-color choices (status pills use semantic colors, not strictly the Scouts BSA palette); implementing this should produce a follow-up ADR documenting what changed and why, per CLAUDE.md's per-decision convention.
- [Requirement 2 - Patrol Visual Identity](02-four-patrols-and-visual-identity.md) — patrol colors are reused as-is on the new cards.
- [Requirement 3 - Multiple Campouts](03-multiple-campouts.md) — this is a new presentation layer over the same campout list.
