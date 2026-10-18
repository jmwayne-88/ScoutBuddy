# Requirement 21 — Loading Skeletons for Server-Rendered Pages

Status: Done
Depends on: none tied to a single ROADMAP iteration; complements [Requirement 14](14-async-action-pending-states.md) (pending states for actions) by covering the separate case of a page's first load

## Goal

Give every server-rendered route a skeleton placeholder (via Next.js's `loading.tsx` convention) that appears while its data is being fetched, so a slow Neon query or a cold database connection shows a shaped, recognizable placeholder instead of a blank white screen or a frozen previous page.

## Source

Recommendation #15 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section.

## Problem

Every page in this app is an `async` Server Component that queries `db` directly before rendering anything (`app/(app)/campouts/[id]/page.tsx`, `app/(app)/menus/[id]/page.tsx`, `app/(app)/patrols/page.tsx`, `app/(app)/patrol-leader/page.tsx`, and others). None of their route segments has a `loading.tsx`, so Next.js's default behavior applies: the previous page stays on screen, unresponsive, until the new page's full data fetch resolves, then the whole thing swaps in at once. On a cold Neon connection (a real, documented possibility per [ADR 0003](../adr/0003-postgres-database-via-neon.md)'s serverless Postgres choice) or simply a slow connection, this can read as a frozen or broken app with no indication anything is happening.

## Requirements

- **REQ-21.1** Each primary route segment that performs its own `db` query before rendering gets a sibling `loading.tsx` using Next.js's built-in Suspense-boundary convention: at minimum, `app/(app)/campouts/[id]/`, `app/(app)/campouts/` (the layout's own campout list query), `app/(app)/menus/[id]/`, `app/(app)/patrols/`, and `app/(app)/patrol-leader/`.
- **REQ-21.2** Each `loading.tsx` renders an MUI `Skeleton`-based placeholder shaped like that page's actual eventual content (e.g. the campout detail page's skeleton echoes its hero-image-plus-progress-bar-plus-patrol-cards shape; the menu page's echoes its header-plus-meal-progress-plus-occasion-cards shape) — not one single generic spinner reused everywhere, so the transition from skeleton to real content doesn't visually jump.
- **REQ-21.3** A skeleton never persists longer than the actual data fetch — it is Next.js's standard `loading.tsx` Suspense fallback, automatically replaced the moment the page's data resolves, not a fixed-duration animation or a manually-dismissed state.
- **REQ-21.4** Skeleton placeholders use theme tokens (via MUI's `Skeleton` component, which already themes correctly in both light and dark mode) — consistent with CLAUDE.md's rule against raw hex/rgb values anywhere in the app.
- **REQ-21.5** Pages with no meaningful per-request data fetch (e.g. `/campouts/new`, `/patrols/new`, the home role picker once [Requirement 17](17-avatar-card-role-picker.md) ships) are not required to have a `loading.tsx` — this requirement targets pages whose render is gated on a real database round trip, not every route in the app uninformly.
- **REQ-21.6** The print route group (`app/(print)/menus/[id]/print/`) is explicitly out of scope — per [ADR 0020](../adr/0020-print-view-route-group-and-pagination.md), the print view deliberately carries no app chrome, and a skeleton flash immediately before a user triggers browser print would be more disruptive than helpful there.

## Acceptance Criteria

- [x] Navigating to a campout detail page, a menu page, `/patrols`, or `/patrol-leader` on a throttled/slow connection shows a shaped skeleton matching that page's layout before the real content appears, not a blank screen or a frozen previous page.
- [x] No skeleton is a single generic spinner reused identically across unrelated pages.
- [x] Skeletons render correctly in both light and dark mode.
- [x] The print view shows no skeleton.

## Out of Scope for This Requirement

- Skeletons for client-side dialog content (dialogs open instantly against already-loaded page data; there is nothing to skeleton there).
- Any change to the underlying data-fetching queries themselves, or to Neon connection handling — this requirement is presentation-only, covering the wait, not shortening it.
- Streaming/partial rendering within a single page (e.g. showing the campout hero before its patrol cards resolve) — this requirement covers whole-page `loading.tsx` fallbacks only, not component-level `<Suspense>` boundaries within a page.

## Related

- [ADR 0003 - Postgres via Neon as the database](../adr/0003-postgres-database-via-neon.md) — the serverless cold-start possibility this requirement's skeletons are meant to smooth over.
- [ADR 0020 - Print view route group and pagination](../adr/0020-print-view-route-group-and-pagination.md) — why the print route is excluded (REQ-21.6).
- [Requirement 14 - Async Action Pending States](14-async-action-pending-states.md) — the equivalent in-flight feedback for an action click rather than a page's first load.
