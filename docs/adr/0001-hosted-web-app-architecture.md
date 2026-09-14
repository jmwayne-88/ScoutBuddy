# 0001. Hosted web app with a shared backend

Date: 2026-09-14
Status: Accepted

## Context

ScoutBuddy's core workflow involves five youth leaders and four patrols who all need to see and act on the same campout and menu state: due dates, dish/ingredient contents, submission status, and ASPL review comments. The stated problem is coordination overhead, not a lack of local tooling — today's process (text, paper, hallway conversations) already fails because there's no single shared source of truth.

## Decision

Build ScoutBuddy as a hosted web application backed by a shared database that every user reads from and writes to over the network, rather than a local-first app whose state lives on individual devices.

## Alternatives Considered

- **Local-first with manual sync** (e.g. a file or browser-local store, shared by export/import or manual merge): simplest to build and free to run, but someone would have to manually reconcile state across five people's devices — this reintroduces the exact coordination burden the tool exists to remove.

## Consequences

- Requires an always-available backend and database (see [0003](0003-postgres-database-via-neon.md)), and a host to run it on (see [0004](0004-vercel-deployment-via-github.md)).
- Enables true real-time shared state and sets up cleanly for the future adult read-only oversight view.
- Users need network connectivity to see current state; offline use at a campsite with no signal is not addressed by this decision and would need to be revisited if it becomes a real requirement.
