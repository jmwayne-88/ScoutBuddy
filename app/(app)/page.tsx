import { redirect } from "next/navigation";
import { getActor } from "@/lib/session";

// REQ-31: this used to be the role picker (ADR 0010). app/(app)/layout.tsx
// now redirects a signed-out visitor to /login before this page is ever
// reached, and role is fixed at signup rather than re-chosen per visit --
// so this page's only job left is sending an already-signed-in person to
// their actual landing page.
export default async function HomePage() {
  const actor = await getActor();
  // The layout's gate already guarantees a session exists; this defensive
  // check only matters for the narrow window where role lookup itself
  // failed (see lib/session.ts), not absence of a session.
  redirect(actor?.role === "ASPL" ? "/campouts" : "/patrol-leader");
}
