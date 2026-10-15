#!/usr/bin/env node
"use strict";

// REQ-11.4: a deliberate, human-confirmed path to apply pending migrations
// to the production Neon branch outside of a normal deploy (Vercel's own
// Production build command -- see vercel.json, REQ-11.3 -- is the primary
// path; this exists for the rare case a migration needs to land before the
// next push).
//
// Run via `npm run migrate:production`, which loads
// .env.migrate-production.local through Node's --env-file flag before this
// script starts, so process.env.DATABASE_URL/DIRECT_URL already hold
// production's values by the time this file executes.
//
// Deliberately not named .env.production.local: Next.js auto-loads that
// exact filename during any local `next build`/`next start`, which would
// silently point a local run at production instead of only this script.

const { execSync } = require("node:child_process");
const readline = require("node:readline/promises");

function resolveHost(url) {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

async function main() {
  const host = resolveHost(process.env.DATABASE_URL);
  if (!host) {
    console.error(
      "DATABASE_URL is not set. Did .env.migrate-production.local fail to load? " +
        "Run this via `npm run migrate:production`, not `node scripts/migrate-production.js` directly."
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Target database host: ${host}\n`);
  // `prisma migrate status` exits non-zero whenever migrations are pending
  // -- that's the normal, expected case this script exists for, not a
  // failure, so a non-zero exit here must not stop the script before the
  // confirmation prompt. Its output already streamed to the terminal via
  // inherited stdio regardless of the exit code.
  try {
    execSync("npx prisma migrate status", { stdio: "inherit" });
  } catch {
    // non-zero exit from pending migrations (or a real connection problem,
    // which the inherited output above will have already made obvious)
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    '\nType "PRODUCTION" to apply the migrations above to this host, or anything else to cancel: '
  );
  rl.close();

  if (answer !== "PRODUCTION") {
    console.log("Cancelled -- no migration applied.");
    process.exitCode = 1;
    return;
  }

  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}

main();
