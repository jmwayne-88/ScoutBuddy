"use client";

import { useTransition } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { chooseRole } from "@/app/(app)/role-actions";
import type { Actor } from "@/lib/session";

export function RoleSwitcher({
  actor,
  patrols,
}: {
  actor: Actor | null;
  patrols: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  const currentValue = !actor ? "" : actor.role === "ASPL" ? "ASPL" : `PATROL_LEADER:${actor.patrolId}`;

  function handleChange(event: SelectChangeEvent) {
    const value = event.target.value;
    if (!value) return;
    const formData = new FormData();
    formData.set("role", value);
    startTransition(() => {
      chooseRole(formData);
    });
  }

  return (
    <Select
      value={currentValue}
      onChange={handleChange}
      disabled={isPending}
      displayEmpty
      size="small"
      variant="standard"
      disableUnderline
      aria-label="Select a role"
      sx={{
        color: "inherit",
        fontSize: "0.875rem",
        "& .MuiSvgIcon-root": { color: "inherit" },
      }}
    >
      <MenuItem value="" disabled>
        Select a role
      </MenuItem>
      <MenuItem value="ASPL">ASPL of Camping</MenuItem>
      {patrols.map((p) => (
        <MenuItem key={p.id} value={`PATROL_LEADER:${p.id}`}>
          Patrol Leader — {p.name}
        </MenuItem>
      ))}
    </Select>
  );
}
