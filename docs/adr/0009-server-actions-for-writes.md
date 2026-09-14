# 0009. Next.js Server Actions for writes, Server Components for reads

Date: 2026-09-14
Status: Accepted

## Context

[ADR 0002](0002-nextjs-application-framework.md) chose Next.js but didn't settle how the app talks to the database: hand-rolled REST API routes with client-side `fetch` calls, or Next's Server Actions/Server Functions (`'use server'` functions invoked directly from `<form action={...}>`).

## Decision

All mutations (create campout, assign menu, add/remove dish, add/remove ingredient, update notes, submit, approve, reject) are Server Actions, colocated with the pages that use them (e.g. `app/menus/[id]/actions.ts`). All reads happen directly in Server Components via Prisma (`lib/db.ts`), no separate fetch layer.

Every action re-derives the current actor from the session cookie ([ADR 0010](0010-cookie-based-role-identity.md)) and re-checks permissions ([ADR 0007](0007-menu-status-lifecycle-and-permissions.md)'s functions) before touching the database — never trusting form data beyond IDs, per Next.js's own guidance that a Server Action is "reachable to anyone who can send the same POST," not just from the rendered form.

## Alternatives Considered

- **REST API routes** (`app/api/.../route.ts`) with client-side `fetch`: more conventional/portable if this were ever consumed by something other than this app's own UI, but doubles the code for every mutation (route handler + client call site) for no benefit to a single-maintainer app with no external API consumers.

## Consequences

- Forms work with progressive enhancement (plain POST, no client JS required to submit) — verified directly during Iteration 1 testing by driving the real endpoints with `curl`, since Server Action forms render a real `action` URL and a hidden field identifying the action.
- No separate API surface exists to document or version — the Server Actions *are* the mutation API, and they're private to this app (not meant to be called from outside it).
- If ScoutBuddy ever needs a mutation API for something other than its own pages (e.g. a future mobile client), that would need actual API routes at that point — this decision doesn't preclude adding them later, it just says not to build them now.
