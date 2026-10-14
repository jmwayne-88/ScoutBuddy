"use client";

import Link from "next/link";
import MuiLink from "@mui/material/Link";
import type { LinkProps } from "@mui/material/Link";

// See components/LinkButton.tsx for why `Link` must be resolved inside a
// client module rather than passed in as a `component` prop value.
type NavLinkProps = Omit<LinkProps<typeof Link>, "component"> & { href: string };

export function NavLink({ href, ...props }: NavLinkProps) {
  return <MuiLink component={Link} href={href} {...props} />;
}
