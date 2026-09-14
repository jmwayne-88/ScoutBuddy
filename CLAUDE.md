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

## Fixed reference data

Four patrols, not user-creatable, each with a background color (foreground text color is computed for contrast, never hand-set):

- Eagle Patrol — blue
- Puma Patrol — gold
- Raven Patrol — dark purple
- Silver Fox Patrol — silver

Six standard meal-framework occasions, in this order: Friday Cracker Barrel, Saturday Breakfast, Saturday Lunch, Saturday Dinner, Saturday Cracker Barrel, Sunday Breakfast.

## Status lifecycle

Not Started → In Progress → Submitted → Changes Requested → Approved

- Patrol Leader can edit the menu in any status except Approved, and can move it to Submitted.
- Only the ASPL of Camping can set Changes Requested (with comments) or Approved.
- A Patrol Leader can never approve or reject their own menu.

## Working conventions

- **Every architecture decision gets its own ADR.** Any time a real architectural choice is made or changed (stack, hosting, data model shape, a new external service, a significant convention like the status state machine) — not just at project kickoff — write a new numbered file in [docs/adr/](docs/adr/README.md) following the existing Context / Decision / Alternatives Considered / Consequences format, link it from `docs/adr/README.md`'s index, and cross-link related ADRs. If a decision supersedes an earlier one, write a new ADR and update the old one's Status line rather than editing its original content away.
- (To be filled in further as the codebase takes shape — testing approach, folder structure, naming conventions.)
