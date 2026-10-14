"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

// MUI's Button is a Client Component; passing `component={Link}` as a prop
// value from a Server Component (not rendering it as JSX) fails React Server
// Components' prop-serialization under this Next/React version ("Functions
// cannot be passed directly to Client Components" — confirmed by running
// the app, see ADR 0017). Resolving `Link` inside a client module sidesteps
// the boundary entirely.
type LinkButtonProps = Omit<ButtonProps<typeof Link>, "component"> & { href: string };

export function LinkButton({ href, ...props }: LinkButtonProps) {
  return <Button component={Link} href={href} {...props} />;
}
