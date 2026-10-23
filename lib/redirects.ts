// REQ-34.5: /login?next=... returns someone to the invitation they were
// accepting. Only a same-site path is honored -- anything that could
// leave the site ("//evil.example", "https://...", "/\evil") falls back to
// "/", so the parameter can't be used as an open redirect.
export function safeNextPath(next: string | null | undefined): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
