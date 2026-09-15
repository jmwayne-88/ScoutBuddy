# 0014. Separate Neon branch for development and testing

Date: 2026-09-15
Status: Accepted

## Context

[ADR 0003](0003-postgres-database-via-neon.md) set up a single Neon database, used for local development, for the manual/automated verification done while building Iterations 1-5, and eventually for the live application. That was fine while ScoutBuddy was purely a work-in-progress, but it means real troop data and disposable test data would end up in the exact same tables once the app is actually in use — a stray test campout, a schema experiment, or a bad migration run locally could land on top of live data with no isolation at all. [Requirement 6](../requirements/06-test-database-isolation.md) requires this to stop being possible before real use starts.

## Decision

Use Neon's native branching to split the existing single database into two: a **`production`** branch that the live Vercel deployment connects to, and a **`development`** branch that local development and all testing (including the `curl`-driven end-to-end walkthroughs used in prior iterations) connects to instead. Both branches live in the same Neon project — no second account or project to manage — but are otherwise fully separate Postgres databases with their own connection strings.

- Local `.env` (`DATABASE_URL`, `DIRECT_URL`) points at the `development` branch's connection strings.
- Vercel's **Production** environment variables point at the `production` branch's connection strings, set directly in Vercel's dashboard — never mirrored into `.env` or committed.
- A schema change is applied with `prisma migrate dev` against `development` first, verified there, and only applied to `production` as a separate, deliberate step when deploying that change (exact mechanism — manual `prisma migrate deploy` vs. a CI step — is a follow-up decision, not settled by this ADR).

## Alternatives Considered

- **Two separate Neon projects**: gives the same isolation with zero chance of the two ever being confused at the project level, but means two dashboards, two sets of credentials to manage, and loses Neon's branching being purpose-built for exactly this dev/prod split (including future options like an ephemeral branch per Vercel preview deployment). Rejected as more manual overhead for no real safety benefit over branches within one project.
- **One database, a naming/schema convention** (e.g. a `test_` table prefix or separate Postgres schema within the same database): rejected — it's a convention, not a boundary. A mistyped migration or a bug in test setup could still reach live tables in the same database; branching gives a real, connection-string-level separation instead.

## Consequences

- Two sets of database credentials now exist. Both are still subject to [ADR 0005](0005-env-based-secrets-management.md): kept out of git, `.env` holds only the `development` branch's strings, and `.env.example`'s placeholders should make clear which role each variable plays.
- Every future schema change now has two steps instead of one: migrate `development`, verify, then migrate `production` at deploy time. Skipping the second step means production silently falls behind the code that expects the new schema — worth catching before it ships, not something this ADR by itself prevents.
- The test data already sitting in the current database (from building and verifying Iterations 1-5) stays wherever the branch split leaves it; since no real troop data exists yet, no data migration or cleanup is required as part of this decision.
- Creating the `development` branch, updating local `.env`, and configuring Vercel's Production environment variables are implementation steps that follow from this decision — not yet done as of this ADR being written.
