import { defineConfig } from "vitest/config";
import path from "node:path";

// REQ-27.6: lib/unit-isolation.test.ts runs against the development
// database, so tests need .env's DATABASE_URL (ADR 0014: .env only ever
// points at the development branch). Missing .env just means that suite
// skips.
try {
  process.loadEnvFile(path.resolve(import.meta.dirname, ".env"));
} catch {
  // No .env -- fine.
}

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
