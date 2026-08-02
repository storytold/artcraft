/**
 * Dedupe a media token list before sending it to the backend.
 *
 * The backend batch-looks-up every media token in a request at once and rejects the
 * whole request when the same token appears twice (found count != token count) — e.g.
 * one file added as two references, or two uploads of the same file hash-deduped into
 * a single media token.
 */
export function uniqueTokens(tokens: string[]): string[] {
  return [...new Set(tokens)];
}
