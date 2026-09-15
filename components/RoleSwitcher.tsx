"use client";

import { useTransition, type ChangeEvent } from "react";
import { PATROLS } from "@/lib/constants";
import { chooseRole } from "@/app/role-actions";
import type { Actor } from "@/lib/session";

export function RoleSwitcher({ actor }: { actor: Actor | null }) {
  const [isPending, startTransition] = useTransition();

  const currentValue = !actor ? "" : actor.role === "ASPL" ? "ASPL" : `PATROL_LEADER:${actor.patrol}`;

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (!value) return;
    const formData = new FormData();
    formData.set("role", value);
    startTransition(() => {
      chooseRole(formData);
    });
  }

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      disabled={isPending}
      className="rounded bg-white/15 text-white text-sm px-2 py-1 border border-white/40"
    >
      <option value="" disabled>
        Select a role
      </option>
      <option value="ASPL">ASPL of Camping</option>
      {PATROLS.map((p) => (
        <option key={p.value} value={`PATROL_LEADER:${p.value}`}>
          Patrol Leader — {p.label}
        </option>
      ))}
    </select>
  );
}
