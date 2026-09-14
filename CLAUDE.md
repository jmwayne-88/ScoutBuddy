# ScoutBuddy

A tool for a youth-led Scouting troop that scaffolds campout menu planning so youth leaders can run it independently. See [FEATURES.md](FEATURES.md) for the full feature spec — treat it as the source of truth for scope and keep it current as features are added.

## Domain language

Use real troop terms throughout code, UI copy, and comments. Do not genericize:

- Patrol Leader, ASPL of Camping
- Patrol, campout
- Cracker Barrel, meal framework

## Architecture

- **Stack**: Next.js (React + TypeScript), API routes in the same project, Postgres via a managed free-tier host (Supabase or Neon), deployed on Vercel.
- **Why a hosted backend, not local-only**: multiple youth leaders across four patrols need to see the same campout/menu state from their own devices — this is shared, synced state, not something that can live on one device.
- **Why this stack**: single language across frontend/backend, minimal infrastructure to operate, free-tier friendly, and Vercel + GitHub gives push-to-deploy without dedicated ops support.

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

(To be filled in as the codebase takes shape — testing approach, folder structure, naming conventions.)
