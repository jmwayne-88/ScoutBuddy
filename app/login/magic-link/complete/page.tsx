import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

// REQ-31.3: Better Auth's own GET /api/auth/magic-link/verify endpoint
// consumes the token and establishes the session server-side, then
// redirects the browser here (the `callbackURL` passed when the link was
// requested, components/MagicLinkRequestForm.tsx). This page's only job is
// routing to the right landing spot now that a session exists -- there's
// no token or verification logic here, that already happened.
export default async function MagicLinkCompletePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login/magic-link?error=1");
  }
  redirect(user.actor.role === "ASPL" ? "/campouts" : "/patrol-leader");
}
