import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { NavLink } from "@/components/NavLink";
import type { Actor } from "@/lib/session";

// REQ-13.6/13.7: every role-gated page shows the same shape of message and
// a working link onward to the visitor's own landing page -- never a dead
// end with no way forward.
export function RoleMismatchNotice({ actor, requiredRoleLabel }: { actor: Actor | null; requiredRoleLabel: string }) {
  const { href, label } =
    actor === null
      ? { href: "/", label: "Pick a role" }
      : actor.role === "ASPL"
        ? { href: "/campouts", label: "Go to your campouts" }
        : { href: "/patrol-leader", label: "Go to your patrol's menus" };

  return (
    <Stack spacing={1}>
      <Typography>You&apos;re not currently acting as {requiredRoleLabel}.</Typography>
      <Typography>
        <NavLink href={href}>{label}</NavLink>
      </Typography>
    </Stack>
  );
}
