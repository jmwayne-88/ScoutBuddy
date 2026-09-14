# 0004. Vercel deployment connected to GitHub

Date: 2026-09-14
Status: Accepted

## Context

ScoutBuddy needs to be reachable by youth leaders from their own devices ([0001](0001-hosted-web-app-architecture.md)), deployed without manual server management, using the chosen framework ([0002](0002-nextjs-application-framework.md)).

## Decision

Host the app on Vercel, with the project imported directly from the GitHub repository (`jmwayne-88/ScoutBuddy`), so every push to `main` triggers a deploy.

## Alternatives Considered

- Other hosts (Netlify, Render, Railway, self-managed VM/container): would work, but none offer a meaningfully simpler path for a Next.js app than Vercel, which is built by the same team and integrates with zero extra configuration.

## Consequences

- Deploys are triggered by pushes to GitHub; no separate CI/CD system is needed for basic deployment.
- Production secrets (e.g. `DATABASE_URL`) must be configured in Vercel's project environment variable settings, separately from local `.env.local` (see [0005](0005-env-based-secrets-management.md)) — not yet done as of this writing, pending the app scaffold.
- The GitHub repository is the source of truth; Vercel always builds from what's pushed there.
