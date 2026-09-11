// Reentrant guard shared by the sync controller and the canvas bridge:
// store writes made by the persistence machinery itself (hydration inserts,
// token write-back, board-switch canvas swaps) must not re-mark boards
// dirty, or every sync-driven write would schedule another save.

let depth = 0;

export const isDirtySuppressed = (): boolean => depth > 0;

export function withDirtySuppressed<T>(run: () => T): T {
  depth++;
  try {
    return run();
  } finally {
    depth--;
  }
}
