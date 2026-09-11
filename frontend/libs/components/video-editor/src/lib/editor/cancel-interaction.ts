// Generic "escape key" cancellation registry. Components register a cancel
// callback (resize gesture, drag gesture, marquee, scrub, etc.) and the host's
// Esc handler calls `cancelInteraction()` to drain the queue. The first
// caller "wins" because the queue clears before any callback runs.

type CancelFn = () => void;

const cancellers = new Set<CancelFn>();

export function registerCanceller({ fn }: { fn: CancelFn }): () => void {
  cancellers.add(fn);

  return () => {
    cancellers.delete(fn);
  };
}

export function cancelInteraction(): boolean {
  if (cancellers.size === 0) return false;

  const activeCancellers = Array.from(cancellers);
  cancellers.clear();

  for (const cancel of activeCancellers) {
    cancel();
  }

  return true;
}
