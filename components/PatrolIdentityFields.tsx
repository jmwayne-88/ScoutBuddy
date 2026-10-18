"use client";

import { useState } from "react";
import TextField from "@mui/material/TextField";
import { PatrolIconField } from "@/components/PatrolIconField";

// REQ-18.9's live, as-you-type icon suggestion needs the icon picker to
// see the name field's current value on every keystroke, not just at
// submit time. The two pages that render this (`/patrols/new`,
// `/patrols/[id]`) are Server Components with no client state of their
// own, so this one "use client" wrapper owns the name field's state and
// hands it down to `PatrolIconField` -- the same "build the whole
// composition in one client module" shape as `components/RoleForm.tsx`.
// The name `<input>` here is still a literal field inside the page's own
// `<form action={...}>`, so it submits exactly like an uncontrolled
// `TextField` would.
export function PatrolIdentityFields({
  defaultName,
  defaultIcon,
}: {
  defaultName: string;
  defaultIcon: string | null;
}) {
  const [name, setName] = useState(defaultName);

  return (
    <>
      <TextField
        name="name"
        label="Patrol name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
      />
      <PatrolIconField name="icon" initialIcon={defaultIcon} patrolName={name} />
    </>
  );
}
