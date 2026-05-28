/**
 * Lightweight rolling perf instrumentation for the render pipeline.
 *
 * Toggle at runtime from the devtools console:
 *   window.__renderPerf = true
 *
 * Every FLUSH_EVERY frames the aggregator dumps:
 *   - per-span timing summary (count / mean / p50 / p95 / max, in ms)
 *   - per-counter totals (uploads, canvas allocations by kind, etc.)
 *
 * Zero overhead when disabled: `isRenderPerfEnabled()` short-circuits before
 * any recording happens, so call sites only pay for a global read.
 */

type SpanSample = number;

type SpanStats = {
  samples: SpanSample[];
};

type CounterStats = {
  total: number;
  frames: number;
};

const FLUSH_EVERY = 60;

const spans = new Map<string, SpanStats>();
const counters = new Map<string, CounterStats>();
const pendingCountersThisFrame = new Map<string, number>();

let framesSinceFlush = 0;

declare global {
  interface Window {
    __renderPerf?: boolean;
  }
}

export function isRenderPerfEnabled(): boolean {
  return typeof window !== "undefined" && window.__renderPerf === true;
}

export function recordSpan({
  name,
  durationMs,
}: {
  name: string;
  durationMs: number;
}): void {
  if (!isRenderPerfEnabled()) return;
  let stats = spans.get(name);
  if (!stats) {
    stats = { samples: [] };
    spans.set(name, stats);
  }
  stats.samples.push(durationMs);
}

export async function measureSpanAsync<T>({
  name,
  fn,
}: {
  name: string;
  fn: () => Promise<T>;
}): Promise<T> {
  if (!isRenderPerfEnabled()) return fn();
  const start = performance.now();
  try {
    return await fn();
  } finally {
    recordSpan({ name, durationMs: performance.now() - start });
  }
}

export function measureSpanSync<T>({
  name,
  fn,
}: {
  name: string;
  fn: () => T;
}): T {
  if (!isRenderPerfEnabled()) return fn();
  const start = performance.now();
  try {
    return fn();
  } finally {
    recordSpan({ name, durationMs: performance.now() - start });
  }
}

export function incrementCounter({
  name,
  by = 1,
}: {
  name: string;
  by?: number;
}): void {
  if (!isRenderPerfEnabled()) return;
  pendingCountersThisFrame.set(
    name,
    (pendingCountersThisFrame.get(name) ?? 0) + by,
  );
}

/**
 * Pulls sub-span timings recorded inside the wasm `renderFrame` call and
 * feeds them into the aggregator as ordinary spans.
 */
export function recordWasmFrameProfile(
  entries: Array<{ name: string; durationMs: number }>,
): void {
  if (!isRenderPerfEnabled()) return;
  for (const entry of entries) {
    recordSpan({ name: entry.name, durationMs: entry.durationMs });
  }
}

/**
 * Called once per frame by the top of the render pipeline. Rolls the
 * pending-frame counters into the aggregate and triggers a flush on cadence.
 */
export function onRenderPerfFrameComplete(): void {
  if (!isRenderPerfEnabled()) return;
  for (const [name, count] of pendingCountersThisFrame) {
    let stats = counters.get(name);
    if (!stats) {
      stats = { total: 0, frames: 0 };
      counters.set(name, stats);
    }
    stats.total += count;
    stats.frames += 1;
  }
  pendingCountersThisFrame.clear();

  framesSinceFlush += 1;
  if (framesSinceFlush >= FLUSH_EVERY) {
    flush();
  }
}

function flush(): void {
  const spanRows: Array<Record<string, number | string>> = [];
  for (const [name, stats] of spans) {
    if (stats.samples.length === 0) continue;
    const sorted = [...stats.samples].sort((a, b) => a - b);
    const p = (q: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    spanRows.push({
      span: name,
      count: sorted.length,
      meanMs: +(sum / sorted.length).toFixed(2),
      p50Ms: +p(0.5).toFixed(2),
      p95Ms: +p(0.95).toFixed(2),
      maxMs: +sorted[sorted.length - 1].toFixed(2),
    });
  }
  spanRows.sort((a, b) => Number(b.meanMs) - Number(a.meanMs));

  const counterRows: Array<Record<string, number | string>> = [];
  for (const [name, stats] of counters) {
    counterRows.push({
      counter: name,
      perFrame: +(stats.total / Math.max(1, stats.frames)).toFixed(2),
      total: stats.total,
      frames: stats.frames,
    });
  }
  counterRows.sort((a, b) => Number(b.perFrame) - Number(a.perFrame));

  console.groupCollapsed(
    `[render-perf] summary over ${framesSinceFlush} frames`,
  );
  if (spanRows.length > 0) console.table(spanRows);
  if (counterRows.length > 0) console.table(counterRows);
  console.groupEnd();

  spans.clear();
  counters.clear();
  framesSinceFlush = 0;
}
