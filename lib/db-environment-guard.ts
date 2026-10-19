// REQ-11.2: a startup check that the database this process is about to
// talk to actually matches where it's running. Requirement 8's enum->table
// migration reached the "development" Neon branch but never reached
// "production", and nothing caught that until the live site started
// throwing on every page. Comparing hostnames catches the same class of
// mistake automatically, going forward.
//
// A Neon host (e.g. "ep-fragrant-haze-b4zn25pb-pooler.c-6.us-east-2.aws.neon.tech")
// carries no credentials -- user/password are a separate part of the
// connection string -- so these are safe to commit in plain text, unlike
// DATABASE_URL/DIRECT_URL themselves.
//
// This is DATABASE_URL's host (the pooled connection), not DIRECT_URL's --
// the guard below only ever checks DATABASE_URL (what Prisma's client
// actually connects with at runtime), and Neon's pooled/direct endpoints
// for the same branch have different hostnames (a "-pooler" suffix).
export const NEON_DEVELOPMENT_HOST = "ep-fragrant-haze-b4zn25pb-pooler.c-6.us-east-2.aws.neon.tech";

// Production's pooled DATABASE_URL host (see docs/requirements/infrastructure-deployment/11-production-deployment-pipeline.md).
// Before this was filled in, the constant held a literal placeholder
// ("REPLACE_WITH_PRODUCTION_NEON_HOST") and the guard below treated an
// unfilled placeholder as "not yet configured" (warn, not throw) so that
// shipping this file before rollout couldn't itself cause an outage.
export const NEON_PRODUCTION_HOST: string = "ep-empty-butterfly-b4hr93ek-pooler.c-6.us-east-2.aws.neon.tech";

function resolveHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function assertCorrectDatabaseHost(
  env: { DATABASE_URL?: string; VERCEL_ENV?: string; [key: string]: string | undefined } = process.env
): void {
  const host = resolveHost(env.DATABASE_URL);
  if (!host) return;

  const isProductionDeploy = env.VERCEL_ENV === "production";
  const productionHostConfigured = NEON_PRODUCTION_HOST !== "REPLACE_WITH_PRODUCTION_NEON_HOST";

  if (!productionHostConfigured) {
    if (isProductionDeploy) {
      console.warn(
        "[db-environment-guard] NEON_PRODUCTION_HOST is still a placeholder -- " +
          "this guard cannot verify a production deploy yet. Fill it in " +
          "(lib/db-environment-guard.ts) before relying on this check."
      );
    }
    return;
  }

  if (isProductionDeploy && host !== NEON_PRODUCTION_HOST) {
    throw new Error(
      `Refusing to start: VERCEL_ENV is "production" but DATABASE_URL's host ` +
        `(${host}) does not match the known production host. Check Vercel's ` +
        `Production environment variables.`
    );
  }

  if (!isProductionDeploy && host === NEON_PRODUCTION_HOST) {
    throw new Error(
      `Refusing to start: this looks like a non-production environment, but ` +
        `DATABASE_URL points at the production host (${host}). Check .env for ` +
        `an accidentally-pasted production connection string.`
    );
  }
}
