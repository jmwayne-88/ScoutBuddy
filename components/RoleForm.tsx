"use client";

import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Button from "@mui/material/Button";
import { PatrolBadge } from "@/components/PatrolBadge";

// MUI's FormControlLabel reads `control.props.*` synchronously to derive
// `disabled`/`required`/`checked`/etc. When `control={<Radio />}` is
// constructed in a Server Component and crosses into this Client Component
// as a prop, React serializes it as a not-yet-resolved reference rather than
// a plain element, so `control.props` is `undefined` and every one of those
// reads throws "Cannot read properties of undefined" (confirmed by running
// the app — see ADR 0017). Building the whole Radio/FormControlLabel tree
// inside a client component, with `action` passed in as a Server Action
// reference (which *is* safely serializable across the boundary), avoids it.
export function RoleForm({
  action,
  defaultValue,
  patrols,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValue: string;
  patrols: { id: string; name: string; color: string }[];
}) {
  return (
    <form action={action}>
      <Stack spacing={3}>
        <FormControl>
          <FormLabel id="role-label">I am...</FormLabel>
          <RadioGroup aria-labelledby="role-label" name="role" defaultValue={defaultValue}>
            <FormControlLabel value="ASPL" control={<Radio />} label="the ASPL of Camping" />
            {patrols.map((p) => (
              <FormControlLabel
                key={p.id}
                value={`PATROL_LEADER:${p.id}`}
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} component="span" sx={{ alignItems: "center" }}>
                    <span>the Patrol Leader for</span>
                    <PatrolBadge name={p.name} color={p.color} />
                  </Stack>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
        <Button type="submit" variant="contained" color="primary" sx={{ alignSelf: "flex-start" }}>
          Continue
        </Button>
      </Stack>
    </form>
  );
}
