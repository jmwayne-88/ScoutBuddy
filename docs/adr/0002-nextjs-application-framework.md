# 0002. Next.js (React + TypeScript) as the application framework

Date: 2026-09-14
Status: Accepted

## Context

Having decided on a hosted web app ([0001](0001-hosted-web-app-architecture.md)), a framework was needed. ScoutBuddy is maintained by one person for a troop, with no dedicated ops support, so minimizing the number of moving pieces to operate and deploy matters more than framework flexibility.

## Decision

Use Next.js with TypeScript for both the frontend UI and the backend API routes, in a single codebase.

## Alternatives Considered

- **Separate SPA + REST/Express (or similar) backend**: more architectural flexibility, but two codebases and two deploy targets to operate — more than this project needs.
- **Other meta-frameworks (Remix, SvelteKit, etc.)**: comparable in capability; no requirement favored them over Next.js, and Next.js has the most direct integration with the chosen host, Vercel ([0004](0004-vercel-deployment-via-github.md)).

## Consequences

- Frontend and backend are colocated and deploy together as one unit.
- The project is tied to the React ecosystem for UI work.
- TypeScript is used throughout, which matters for this app's core value: the status/permission state machine ([0007](0007-menu-status-lifecycle-and-permissions.md)) benefits from compile-time checking of status/role handling.
