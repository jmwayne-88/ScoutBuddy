# 0003. Postgres via Neon as the database

Date: 2026-09-14
Status: Accepted

## Context

The shared-backend decision ([0001](0001-hosted-web-app-architecture.md)) requires a real database: relational data for campouts, patrols, menus, meals, dishes, ingredients, and reviews, with straightforward relationships between them (a menu belongs to a campout and a patrol; a meal belongs to a menu; a dish belongs to a meal; an ingredient belongs to a dish). No dedicated database administration support exists for this project.

## Decision

Use Postgres, hosted on Neon's managed free tier, as the database. Connection is via a pooled connection string (`DATABASE_URL`), provisioned directly in Neon's dashboard.

## Alternatives Considered

- **Supabase**: comparable managed Postgres offering with extra built-in features (auth, storage, dashboard UI) not currently needed. Considered as an equally valid option; Neon was chosen simply because it's the provider that was provisioned first.
- **Self-hosted Postgres**: rejected — would require operating and patching a database server, which is out of scope for a project with no dedicated ops support.

## Consequences

- The app connects to Postgres via a single `DATABASE_URL` connection string, kept out of version control (see [0005](0005-env-based-secrets-management.md)).
- Schema/migrations will need a tool (e.g. Prisma or Drizzle) chosen at build time; not yet decided.
- Switching providers later (e.g. to Supabase) is possible since both are standard Postgres, but is not currently planned.
