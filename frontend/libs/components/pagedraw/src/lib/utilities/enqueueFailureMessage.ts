// enqueueFailureMessage: turns whatever a failed "start a generation" call rejected with into one sentence for an error toast.
// Used by PageDraw's Generate handler. Kept inside this package (instead of importing the Tauri-only commandErrorMessage)
// because PageDraw is also used with a REST adapter (see adapter.ts), whose failures are ordinary Errors.
// Touches nothing: it only reads the value it is given.

// What the Rust command layer rejects with, in the shapes the app uses: { error_message } or { error_details: { error_message } }.
type CommandLikeError = {
  error_message?: unknown;
  error_details?: { error_message?: unknown };
  message?: unknown;
};

// True when the value is a non-empty string (an empty string is useless as a toast).
const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/**
 * Picks the most useful sentence out of a rejection, or returns `fallback` when it carries none.
 * - a plain string is used as it is;
 * - a Rust command error uses its `error_message`;
 * - a normal Error (REST host, network failure) uses its `message`;
 * - anything else (undefined, null, a number) gets the fallback.
 */
export function enqueueFailureMessage(error: unknown, fallback: string): string {
  // A rejection that is already a sentence.
  if (isText(error)) return error;
  // An object: look for the Rust command shape first, then the standard Error shape.
  if (error && typeof error === "object") {
    const candidate = error as CommandLikeError;
    if (isText(candidate.error_message)) return candidate.error_message;
    if (isText(candidate.error_details?.error_message)) {
      return candidate.error_details.error_message;
    }
    if (isText(candidate.message)) return candidate.message;
  }
  // Nothing usable: the caller's plain sentence.
  return fallback;
}
