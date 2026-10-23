"use client";

import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { magicLinkClient } from "better-auth/client/plugins";

// REQ-31: vanilla (non-React-hooks) client, matching this project's
// existing pattern of plain async client logic + useState for pending/
// error state (see components/CampoutUploadForm.tsx) rather than a data-
// fetching hooks library this app doesn't otherwise use.
export const authClient = createAuthClient({
  plugins: [passkeyClient(), magicLinkClient()],
});
