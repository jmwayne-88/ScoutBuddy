// REQ-13.1/13.2: the one place every mutating Server Action builds its
// post-redirect toast URL, so feedback is wired up the same way everywhere
// rather than reimplemented per action. Pairs with components/ToastListener,
// which reads and then strips these params on the client.
//
// REQ-15.4: a Tier 2 destructive action (see docs/requirements/
// ../docs/requirements/ux-interaction-polish/15-consistent-destructive-action-pattern.md) can additionally pass `undo`
// — a flat, JSON-serializable payload plus the string key of the Server
// Action (registered in ToastListener's UNDO_ACTIONS) that reverses it.
export type UndoSpec = { action: string; payload: Record<string, unknown> };

export function withToast(
  path: string,
  message: string,
  options?: { celebrate?: boolean; undo?: UndoSpec }
): string {
  const [base, existingQuery] = path.split("?");
  const params = new URLSearchParams(existingQuery);
  params.set("toast", message);
  if (options?.celebrate) {
    params.set("celebrate", "1");
  } else {
    params.delete("celebrate");
  }
  if (options?.undo) {
    params.set("undoAction", options.undo.action);
    params.set("undoPayload", JSON.stringify(options.undo.payload));
  } else {
    params.delete("undoAction");
    params.delete("undoPayload");
  }
  return `${base}?${params.toString()}`;
}
