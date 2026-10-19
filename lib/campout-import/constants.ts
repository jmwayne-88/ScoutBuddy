// REQ-30.2: generous for any real troop flyer/calendar, bounded to keep
// parsing time and AI token cost reasonable -- not a platform/body-size
// constraint (see ADR 0032; the file never passes through a Server
// Action's own request body). Shared between the upload Server Action and
// the Blob-upload Route Handler, neither of which can export a plain
// constant itself: a "use server" file may only export async functions.
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
