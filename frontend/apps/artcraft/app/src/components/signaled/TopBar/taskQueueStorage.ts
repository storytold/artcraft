// Last-read timestamp behind the task-queue unread badge. Stored in
// localStorage, which the browser may deny (private mode, blocked cookies,
// an enterprise policy): a denied or corrupt read must fall back to 0, never
// throw during render — see issue #1984, where one rejected getItem blanked
// the whole frontend before account setup.
export const TASK_QUEUE_LAST_READ_KEY = "taskQueueLastReadAt";

export function readTaskQueueLastReadAt(): number {
  try {
    const stored = localStorage.getItem(TASK_QUEUE_LAST_READ_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}
