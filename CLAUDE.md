# ScoutBuddy

A tool for a youth-led Scouting troop that scaffolds campout menu planning so youth leaders can run it independently. See [FEATURES.md](FEATURES.md) for the full feature spec — treat it as the source of truth for scope and keep it current as features are added.

## Domain language

Use real troop terms throughout code, UI copy, and comments. Do not genericize:

- Patrol Leader, ASPL of Camping
- Patrol, campout
- Cracker Barrel, meal framework

## Architecture

- **Stack**: Next.js (React + TypeScript), API routes in the same project, Postgres via Neon, deployed on Vercel from the `jmwayne-88/ScoutBuddy` GitHub repo.
- Full rationale for every architectural choice lives in [docs/adr/](docs/adr/README.md) as individual Architecture Decision Records — read those before proposing a stack or data-model change, and add a new ADR when a real decision is made rather than just editing code.

## Design system

MUI (Material UI) is the only component library, themed in `lib/theme/` (see [ADR 0017](docs/adr/0017-adopt-mui-design-system.md)) — Tailwind (ADR 0011) has been removed.

- Never use a raw hex/rgb/hsl value in a component. Reference `theme.palette.*` (via `sx`, e.g. `sx={{ bgcolor: 'brand.olive' }}`) or, in plain CSS, `var(--mui-palette-*)`. Brand colors live once in `lib/theme/tokens.ts`.
- `primary` (Scouting America Blue) is the general action/AppBar/link color; `secondary` (Scouting America Red) is a sparing high-emphasis accent only — it must never read as the default/dominant action color. `error` is its own distinct red; never reuse brand red for an error state.
- `palette.brand.olive` carries the pre-existing "secondary action" meaning (Request Changes, Remove occasion) — a named token, not a raw hex.
- Pale/tan brand colors (`paleBlue`, `tan`, `lightTan`, `darkTan`, `paleGray`) are backgrounds/borders/decorative only — never text on a light background.
- Don't recreate or approximate Scouting America logos, the fleur-de-lis, or program marks. Reference files the user places in `public/brand/` if logos are ever needed.
- Before finishing UI work: run `npm test` (includes `lib/theme/contrast.test.ts`, which fails if any theme color pairing drops below its WCAG 2.2 threshold) and check layouts at 360px and 1440px.
- `/style-guide` is a living reference for every token, typography variant, and component default — not linked from production navigation.
- **MUI + Server Components gotcha** (confirmed by running the app, not hypothetical): passing a `component` prop value (e.g. `component={Link}` for `next/link`) from a Server Component into an MUI Client Component — or passing a JSX element like `control={<Radio />}` into `FormControlLabel`, or `icon={<SomeIcon />}` into `Chip`, or rendering `<Tooltip>` around a child built in a Server Component — crashes or hydration-mismatches at request time in this Next/React version, because the element doesn't survive the Server→Client serialization boundary as a plain object with `.props` (a hard crash — "Cannot read properties of undefined" — for props MUI reads synchronously like `FormControlLabel`'s `control`; a silent hydration mismatch, not a crash, for props MUI clones like `Chip`'s `icon` or `Tooltip`'s child). Build the whole composition inside a dedicated `"use client"` wrapper instead — see `components/LinkButton.tsx`, `components/NavLink.tsx`, `components/CampoutCard.tsx`, `components/RoleForm.tsx`, `components/MenuStatusChip.tsx`, `components/RelativeDate.tsx`. Also avoid assigning a component reference to a capitalized variable and rendering it as JSX inside a function body (`const Icon = lookup[key]; <Icon />`) — `eslint-plugin-react-hooks`'s `static-components` rule flags this even when the lookup is a stable, static table; build a module-level table of already-constructed elements instead (see `components/MenuStatusChip.tsx`).

## Fixed reference data

The patrols, not user-creatable, each with a background color (foreground text color is computed for contrast, never hand-set):

- Eagle Patrol — blue
- Puma Patrol — gold
- Raven Patrol — dark purple
- Silver Fox Patrol — silver
- Joe Patrol — brown

Six standard meal-framework occasions, in this order: Friday Cracker Barrel, Saturday Breakfast, Saturday Lunch, Saturday Dinner, Saturday Cracker Barrel, Sunday Breakfast.

## Status lifecycle

Not Started → In Progress → Submitted → Changes Requested → Approved

- Patrol Leader can edit the menu in any status except Approved, and can move it to Submitted.
- Only the ASPL of Camping can set Changes Requested (with comments) or Approved.
- A Patrol Leader can never approve or reject their own menu.

## Working conventions

- **Every architecture decision gets its own ADR.** Any time a real architectural choice is made or changed (stack, hosting, data model shape, a new external service, a significant convention like the status state machine) — not just at project kickoff — write a new numbered file in [docs/adr/](docs/adr/README.md) following the existing Context / Decision / Alternatives Considered / Consequences format, link it from `docs/adr/README.md`'s index, and cross-link related ADRs. If a decision supersedes an earlier one, write a new ADR and update the old one's Status line rather than editing its original content away.
- (To be filled in further as the codebase takes shape — testing approach, folder structure, naming conventions.)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
