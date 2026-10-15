# 0020. A chrome-free route group for print views, with a padding-as-margin pagination strategy

Date: 2026-10-15
Status: Accepted

## Context

[Requirement 12](../requirements/12-menu-print-preview.md) asks for a dedicated, print-optimized view of one patrol's menu that a Patrol Leader can preview on screen exactly as it will print, then actually print, with no app chrome anywhere. Every route in this app has always rendered inside a single root `app/layout.tsx` that unconditionally wraps `{children}` in the AppBar/nav/role-switcher — there was no way to opt a single route out of that chrome before this requirement, because Next.js App Router layouts nest top-down from one root.

## Decision

**Split the root layout into two route groups.** `app/layout.tsx` keeps only `<html>/<body>`, font loading, and `ThemeRegistry` — nothing visual. The AppBar/Toolbar/Container chrome that used to live there moves, unchanged, into a new `app/(app)/layout.tsx`, and every existing route moves under that `(app)` group (route groups are invisible in the URL, so every route keeps resolving at its original path — verified against the dev server and a full build). The new print view lives in a sibling `app/(print)/menus/[id]/print/page.tsx`, inheriting only the slimmed-down root — no AppBar, ever, on screen or on paper.

**Pagination uses padding, not the browser's `@page` margin, to stay consistent between screen and print.** Two fixed-size `.printPage` divs (`width: 8.5in; height: 11in; padding: 0.5in; box-sizing: border-box`) represent the two printed pages, with a global `@page { size: letter; margin: 0 }`. The div's own padding *is* the visual margin in both contexts — this sidesteps a real fragility: a browser's print dialog can override a CSS `@page margin` (its own "Default/None/Custom" setting takes precedence in some browsers), but it can't override padding on an element already inside the page. The second `.printPage` forces a page break via `break-before: page` (+ the older `page-break-before: always`).

**Text size shrinks toward fitting 2 pages via a deterministic row-count heuristic, not real layout measurement** (`lib/print-layout.ts`'s `pickFontSize`). Nothing server-rendered can measure actual print pagination; this is an approximation, not a guarantee. If content still overflows at the 8pt floor (REQ-12.8), the browser's own normal CSS pagination spills it onto a further page on its own — this requirement doesn't build custom pagination logic, it just tries to reduce how often the fallback is needed.

**One deliberate exception to "MUI is the only [component library]" (CLAUDE.md): a CSS Module (`print.module.css`) carries the `@page`/`break-before`/print-media-query rules**, since none of those have an MUI equivalent — `sx` props can't express `@page`. Every actual rendered component on the print page is still MUI (`Paper`, `Stack`, `Typography`, etc.); only the page geometry and pagination mechanics live in the stylesheet.

## Alternatives Considered

- **A pathname check inside the single root layout** (render the AppBar conditionally based on `usePathname()`): rejected — the root layout is a Server Component today (reads `getActor()`/`getActivePatrols()` without a client roundtrip); a pathname-based client check would force it client-side or require threading the pathname through awkwardly. Route groups are the framework's own documented mechanism for exactly this "some routes get this chrome, some don't" need.
- **Relying on the browser print dialog's own margin setting** instead of padding-as-margin: rejected — it's the one part of print output a web page can't fully control, and REQ-12.4's 0.5in margin is a real requirement, not a suggestion users should have to configure per-print.
- **Real DOM measurement (ResizeObserver, a hidden render pass) to guarantee exact 2-page fit**: rejected as disproportionate — this is server-rendered, print is paginated by the browser's own engine regardless of what this app does, and REQ-12.8 already accepts graceful overflow past the 8pt floor as the fallback.

## Consequences

- Every future route decides, by which group it's placed in, whether it gets the app's chrome — a route placed outside both `(app)` and `(print)` would render with neither, which is probably a mistake worth catching in review rather than something enforced by tooling.
- `components/PrintButton.tsx` is this app's first component whose entire purpose is triggering `window.print()` — a small, deliberately single-purpose Client Component, following the established "wrap the one `onClick` need in its own small client wrapper" pattern (`NavLink`, `LinkButton`).
- `pickFontSize`'s thresholds (11pt down to 8pt at row counts 15/22/30) are a judgment call, not derived from anything measured against real print output — worth revisiting if real campout menus turn out to overflow more (or less) often than expected once this is in real use.

## Related

- [Requirement 12 - Menu Print Preview & Shopping List](../requirements/12-menu-print-preview.md)
- [ADR 0017 - Adopt MUI as the design system](0017-adopt-mui-design-system.md) — the "MUI only" rule this ADR takes one narrow, explicit exception to.
- [ADR 0021 - Claude API ingredient categorization](0021-claude-api-ingredient-categorization.md) — the other new piece of Requirement 12, built alongside this one.
