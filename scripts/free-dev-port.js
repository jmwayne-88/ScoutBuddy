#!/usr/bin/env node
"use strict";

// Turbopack's child process can survive an unclean `next dev` shutdown --
// closing a terminal directly, a killed background task, a timeout, a
// system sleep/resume -- and keep holding the dev port after the parent
// process is gone. The next `next dev` then either silently falls back to
// 3001 instead of 3000, or a stale, unresponsive listener leaves new
// connections refused on 3000 outright. This runs automatically before
// `npm run dev` (via npm's `predev` hook) to clear that out first, so
// "connection refused on localhost:3000" stops being something to
// diagnose each time.

const { execSync } = require("node:child_process");

const PORT = Number(process.env.PORT) || 3000;

function killOnWindows(port) {
  let output;
  try {
    output = execSync("netstat -ano -p tcp", { encoding: "utf-8" });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of output.split("\n")) {
    const match = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
    if (match && Number(match[1]) === port) {
      pids.add(match[2]);
    }
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
      console.log(`[predev] Freed port ${port} (killed stray PID ${pid}).`);
    } catch {
      // already gone by the time we got here -- nothing to do
    }
  }
}

function killOnUnix(port) {
  let pidsOutput;
  try {
    pidsOutput = execSync(`lsof -ti tcp:${port}`, { encoding: "utf-8" });
  } catch {
    return;
  }

  const pids = pidsOutput
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      console.log(`[predev] Freed port ${port} (killed stray PID ${pid}).`);
    } catch {
      // already gone by the time we got here -- nothing to do
    }
  }
}

if (process.platform === "win32") {
  killOnWindows(PORT);
} else {
  killOnUnix(PORT);
}
