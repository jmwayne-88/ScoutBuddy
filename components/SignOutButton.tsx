"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton(props: Omit<ButtonProps, "onClick" | "disabled">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Button {...props} onClick={handleSignOut} disabled={isPending}>
      Sign out
    </Button>
  );
}
