# 0011. Tailwind CSS for styling

Date: 2026-09-14
Status: Accepted

## Context

[ADR 0002](0002-nextjs-application-framework.md) chose Next.js but not a styling approach. Iteration 1 has a handful of screens (role picker, ASPL dashboard, menu detail) built by a single maintainer.

## Decision

Use Tailwind CSS (v4, imported via `@import "tailwindcss";` in `app/globals.css`, configured through `postcss.config.mjs` — no separate `tailwind.config.js` needed at this scale) for all styling, applied directly as utility classes in JSX.

## Alternatives Considered

- **CSS Modules / plain CSS files**: more conventional separation of markup and style, but means naming and maintaining a stylesheet per component for a small number of screens that don't currently need that structure.
- **A component library** (e.g. shadcn/ui, MUI): would speed up polish later, but is more than Iteration 1's plain forms and lists need; worth reconsidering once patrol color-coding ([Iteration 2](../requirements/02-four-patrols-and-visual-identity.md)) and general visual polish become the focus.

## Consequences

- Styling lives inline in JSX as utility classes rather than in separate stylesheets — fast to write and hard to let drift from the markup, at the cost of more verbose class lists on complex elements.
- Iteration 2's patrol background-color-with-computed-contrast-text requirement will need either Tailwind's arbitrary-value utilities (e.g. `bg-[#...]`) or a small inline-style helper for the computed foreground color, since exact hex values per patrol aren't expressible as static Tailwind classes alone — a detail to resolve when that iteration starts, not a blocker now.
