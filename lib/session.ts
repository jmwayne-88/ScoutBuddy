import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE_NAME = "scoutbuddy_actor";

export type Actor =
  | { role: "ASPL" }
  | { role: "PATROL_LEADER"; patrolId: string };

function isActor(value: unknown): value is Actor {
  if (typeof value !== "object" || value === null || !("role" in value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.role === "ASPL") return true;
  if (record.role === "PATROL_LEADER") return typeof record.patrolId === "string";
  return false;
}

export async function getActor(): Promise<Actor | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isActor(parsed)) return null;

  // A Patrol Leader's patrol may have been deleted (not just deactivated)
  // since the cookie was set. Deactivation alone doesn't invalidate an
  // already-active session — only deletion does (see REQ-8.14). Note: this
  // runs during ordinary page renders, not just Server Actions, and Next.js
  // only allows *writing* cookies from a Server Action/Route Handler — so
  // this can't call clearActor() here (that throws: "Cookies can only be
  // modified in a Server Action or Route Handler"). Treating the actor as
  // logged-out without touching the cookie is sufficient: every subsequent
  // getActor() call re-validates the same way, so the stale cookie is inert
  // until the next real role choice (a Server Action) overwrites it.
  if (parsed.role === "PATROL_LEADER") {
    const stillExists = await db.patrol.findUnique({ where: { id: parsed.patrolId } });
    if (!stillExists) {
      return null;
    }
  }

  return parsed;
}

export async function setActor(actor: Actor): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(actor), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearActor(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
