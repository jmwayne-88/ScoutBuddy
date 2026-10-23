import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// REQ-31.1/ADR 0033: Better Auth's standard catch-all mount point --
// every auth endpoint (passkey registration/authentication, magic-link
// request/consume, session read) is served from here.
export const { GET, POST } = toNextJsHandler(auth);
