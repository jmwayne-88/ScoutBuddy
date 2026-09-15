# Requirement 6 — Test Database Isolation

Status: Not started
Depends on: none — cross-cutting infrastructure requirement, not tied to a single ROADMAP iteration

## Goal

Once ScoutBuddy is actually in use by the troop, development work and testing — manual or automated, local or by a future Claude Code session — must never read or write the database backing the live application. Right now there is only one Neon database, and it already holds test data from building Iterations 1-5 (campouts, menus, and dishes created purely to verify the app works). That's fine before real use starts, but needs to stop being true before it does.

## Requirements

- **REQ-6.1** A database exists for local development and testing, separate from the database backing the live/production deployment.
- **REQ-6.2** Local development (`.env`) connects only to the dev/test database — never to production.
- **REQ-6.3** The production deployment (Vercel) connects only to the production database, configured through Vercel's own environment variable scoping, entirely separate from local `.env`.
- **REQ-6.4** Schema changes (Prisma migrations) are applied to and verified against the dev/test database first; applying the same migration to production is a distinct, later step, not a side effect of local development.
- **REQ-6.5** Which database is which is documented (ADR plus the existing `.env.example`/CLAUDE.md pointers), so future work — including a future Claude Code session with no memory of this one — can't accidentally target production out of not knowing better.
- **REQ-6.6** Manual/automated end-to-end verification (the kind of `curl`-driven walkthroughs used to verify Iterations 1-5) runs against the dev/test database.

## Acceptance Criteria

- [ ] Two distinct databases (or Neon branches) exist: one for development/testing, one for production.
- [ ] `.env`'s `DATABASE_URL` and `DIRECT_URL` point at the dev/test database.
- [ ] Vercel's Production environment variables point at a different database than local `.env` uses.
- [ ] Running `npx prisma migrate dev` locally cannot reach the production database — true by connection string, not just by convention or care.
- [ ] Someone new to the project (human or AI) can tell which database is which without having to ask.

## Out of Scope for This Requirement

- Automatic seed/reset tooling for the dev/test database (a nice-to-have, not required to satisfy this requirement).
- Ephemeral per-preview-deployment branches (Vercel's Neon integration can do this automatically; worth considering later, not required now).
- Cleaning up or migrating the test data already sitting in the current database — unnecessary, since no real troop data exists yet at the time this requirement is being written.

## Related

- [ADR 0014 - Separate Neon branch for development and testing](../adr/0014-separate-dev-test-database-branch.md)
- [ADR 0003 - Postgres via Neon](../adr/0003-postgres-database-via-neon.md)
- [ADR 0005 - Secrets kept in gitignored env files](../adr/0005-env-based-secrets-management.md)
