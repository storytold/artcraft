/** Timestamps in the RFC3339 form the Rust backend emits. */

export function nowIso(): string {
  return new Date().toISOString();
}

export function isoFromMillis(millis: number): string {
  return new Date(millis).toISOString();
}
