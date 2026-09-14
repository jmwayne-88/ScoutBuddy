import { cookies } from "next/headers";
import type { Patrol } from "@prisma/client";

const COOKIE_NAME = "scoutbuddy_actor";

export type Actor =
  | { role: "ASPL" }
  | { role: "PATROL_LEADER"; patrol: Patrol };

function isActor(value: unknown): value is Actor {
  if (typeof value !== "object" || value === null || !("role" in value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.role === "ASPL") return true;
  if (record.role === "PATROL_LEADER") return typeof record.patrol === "string";
  return false;
}

export async function getActor(): Promise<Actor | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isActor(parsed) ? parsed : null;
  } catch {
    return null;
  }
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
