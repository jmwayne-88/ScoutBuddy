# 0005. Secrets kept in gitignored env files

Date: 2026-09-14
Status: Accepted

## Context

The database connection string ([0003](0003-postgres-database-via-neon.md)) contains live credentials. It must never be committed to the GitHub repository, which will eventually be readable by more than just the maintainer.

## Decision

Store real secrets in a local `.env` file, excluded from version control via `.gitignore`. Commit a companion `.env.example` file that documents the required variable names with placeholder values, so the required configuration is discoverable without exposing real credentials.

(Originally implemented as `.env.local`, the Next.js-preferred convention — corrected to plain `.env` once Prisma Migrate was wired up in [0008](0008-prisma-orm.md), since the standalone `prisma` CLI only auto-loads `.env`, not `.env.local`. Next.js itself loads both, so `.env` alone satisfies both tools without adding a `dotenv-cli` dependency.)

## Alternatives Considered

- **Committing secrets directly / no example file**: rejected outright — leaks credentials into git history permanently, even if later removed.
- **A secrets manager (e.g. Vercel's env UI as the only source, no local file)**: still needed for production regardless (see [0004](0004-vercel-deployment-via-github.md)), but a local `.env` is still required for local development against the same database.

## Consequences

- Anyone setting up the project locally must obtain the real `DATABASE_URL`/`DIRECT_URL` out-of-band (not via git) and create their own `.env`.
- Production secrets are configured separately in Vercel's dashboard and must be kept in sync manually with what local development uses.
- Because the current Neon connection strings were shared in this conversation's chat history rather than only through `.env`, they should be treated as potentially exposed; rotating them via Neon's dashboard is a low-cost precaution if that's ever a concern.
