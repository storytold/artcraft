/**
 * Whether an event at `now` may run, at most once per `intervalMs`. Only an accepted event moves
 * `last`, so a stream of events faster than the interval still gets one through per interval.
 */
export const throttleAccepts = (
  last: { current: number },
  now: number,
  intervalMs: number,
): boolean => {
  if (now - last.current < intervalMs) {
    return false;
  }
  last.current = now;
  return true;
};
