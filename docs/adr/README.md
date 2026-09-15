# Architecture Decision Records

This directory records the significant architecture decisions made for ScoutBuddy, in the lightweight ADR format (Context / Decision / Alternatives Considered / Consequences). New decisions should be added as new numbered files rather than editing history — if a decision changes, write a new ADR that supersedes the old one and mark the old one's status accordingly.

## Index

- [0001 - Hosted web app with a shared backend](0001-hosted-web-app-architecture.md)
- [0002 - Next.js (React + TypeScript) as the application framework](0002-nextjs-application-framework.md)
- [0003 - Postgres via Neon as the database](0003-postgres-database-via-neon.md)
- [0004 - Vercel deployment connected to GitHub](0004-vercel-deployment-via-github.md)
- [0005 - Secrets kept in gitignored env files](0005-env-based-secrets-management.md)
- [0006 - Meal-framework variation as structured occasion removal](0006-structured-meal-framework-variation.md)
- [0007 - Menu status lifecycle as a role-gated state machine](0007-menu-status-lifecycle-and-permissions.md)
- [0008 - Prisma as the ORM, with the binary query engine](0008-prisma-orm.md)
- [0009 - Next.js Server Actions for writes, Server Components for reads](0009-server-actions-for-writes.md)
- [0010 - Cookie-based role identity, no accounts or passwords](0010-cookie-based-role-identity.md)
- [0011 - Tailwind CSS for styling](0011-tailwind-css.md)
- [0012 - Meal-framework removal modeled as a campout-scoped exception table](0012-meal-framework-exceptions.md)
- [0013 - Editing a Submitted menu does not revert its status](0013-submitted-menu-edits-do-not-revert-status.md)
