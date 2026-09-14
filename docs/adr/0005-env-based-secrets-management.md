# 0005. Secrets kept in gitignored env files

Date: 2026-09-14
Status: Accepted

## Context

The database connection string ([0003](0003-postgres-database-via-neon.md)) contains live credentials. It must never be committed to the GitHub repository, which will eventually be readable by more than just the maintainer.

## Decision

Store real secrets in a local `.env.local` file, excluded from version control via `.gitignore`. Commit a companion `.env.example` file that documents the required variable names with placeholder values, so the required configuration is discoverable without exposing real credentials.

## Alternatives Considered

- **Committing secrets directly / no example file**: rejected outright — leaks credentials into git history permanently, even if later removed.
- **A secrets manager (e.g. Vercel's env UI as the only source, no local file)**: still needed for production regardless (see [0004](0004-vercel-deployment-via-github.md)), but a local `.env.local` is still required for local development against the same database.

## Consequences

- Anyone setting up the project locally must obtain the real `DATABASE_URL` out-of-band (not via git) and create their own `.env.local`.
- Production secrets are configured separately in Vercel's dashboard and must be kept in sync manually with what local development uses.
- Because the current Neon connection string was shared in this conversation's chat history rather than only through `.env.local`, it should be treated as potentially exposed; rotating it via Neon's dashboard is a low-cost precaution if that's ever a concern.
