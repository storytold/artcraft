export const LAST_READ_AT_KEY = "taskQueueLastReadAt";

/**
 * This optional timestamp must not let a storage error prevent TaskQueue from mounting.
 * Accept only the decimal integer format written by writeLastReadAt.
 */
export function readLastReadAt(): number {
  try {
    const stored = localStorage.getItem(LAST_READ_AT_KEY);
    if (stored === null || stored.trim() !== stored || !/^\d+$/.test(stored)) {
      return 0;
    }

    const parsed = Number(stored);
    return Number.isSafeInteger(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function writeLastReadAt(timestamp: number): void {
  try {
    localStorage.setItem(LAST_READ_AT_KEY, String(timestamp));
  } catch {
    // Best-effort persistence; the in-memory state still updates.
  }
}
