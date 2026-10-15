import { describe, expect, it } from "vitest";
import { assertCorrectDatabaseHost, NEON_DEVELOPMENT_HOST, NEON_PRODUCTION_HOST } from "./db-environment-guard";

const productionHostConfigured = NEON_PRODUCTION_HOST !== "REPLACE_WITH_PRODUCTION_NEON_HOST";

describe("assertCorrectDatabaseHost", () => {
  it("allows the development host locally", () => {
    expect(() =>
      assertCorrectDatabaseHost({ DATABASE_URL: `postgresql://u:p@${NEON_DEVELOPMENT_HOST}/db` })
    ).not.toThrow();
  });

  it("allows the development host under a preview deploy", () => {
    expect(() =>
      assertCorrectDatabaseHost({
        DATABASE_URL: `postgresql://u:p@${NEON_DEVELOPMENT_HOST}/db`,
        VERCEL_ENV: "preview",
      })
    ).not.toThrow();
  });

  it("does nothing when DATABASE_URL is missing or unparseable", () => {
    expect(() => assertCorrectDatabaseHost({})).not.toThrow();
    expect(() => assertCorrectDatabaseHost({ DATABASE_URL: "not-a-url" })).not.toThrow();
  });

  it.runIf(productionHostConfigured)(
    "throws when VERCEL_ENV is production but the host isn't production's",
    () => {
      expect(() =>
        assertCorrectDatabaseHost({
          DATABASE_URL: `postgresql://u:p@${NEON_DEVELOPMENT_HOST}/db`,
          VERCEL_ENV: "production",
        })
      ).toThrow(/production/i);
    }
  );

  it.runIf(productionHostConfigured)(
    "throws when not a production deploy but the host is production's",
    () => {
      expect(() =>
        assertCorrectDatabaseHost({ DATABASE_URL: `postgresql://u:p@${NEON_PRODUCTION_HOST}/db` })
      ).toThrow(/production/i);
    }
  );

  it.skipIf(productionHostConfigured)(
    "warns instead of throwing on a production deploy while the host is still a placeholder",
    () => {
      expect(() =>
        assertCorrectDatabaseHost({
          DATABASE_URL: `postgresql://u:p@${NEON_DEVELOPMENT_HOST}/db`,
          VERCEL_ENV: "production",
        })
      ).not.toThrow();
    }
  );
});
