// REQ-13.1/13.2: the one place every mutating Server Action builds its
// post-redirect toast URL, so feedback is wired up the same way everywhere
// rather than reimplemented per action. Pairs with components/ToastListener,
// which reads and then strips these params on the client.
export function withToast(path: string, message: string, options?: { celebrate?: boolean }): string {
  const [base, existingQuery] = path.split("?");
  const params = new URLSearchParams(existingQuery);
  params.set("toast", message);
  if (options?.celebrate) {
    params.set("celebrate", "1");
  } else {
    params.delete("celebrate");
  }
  return `${base}?${params.toString()}`;
}
