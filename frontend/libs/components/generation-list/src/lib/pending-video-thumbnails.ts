import { useSyncExternalStore } from "react";

// Freshly generated video thumbnails are rendered asynchronously after the
// video lands, so the first <img> load usually 404s. A card whose video
// thumbnail fails marks it here; one shared checker then probes every marked
// URL on a backoff until it loads, and subscribed cards swap it in.
//
// Probes add a cache-busting query param (the CDN may have cached the 404 for
// the plain URL), and the URL that loaded is the one handed back to render.

// ── Check schedule ────────────────────────────────────────────────────────

// How often to re-check a marked thumbnail, by time since it was marked.
const CHECK_SCHEDULE: { untilMs: number; everyMs: number }[] = [
  { untilMs: 2 * 60_000, everyMs: 5_000 },
  { untilMs: 10 * 60_000, everyMs: 15_000 },
  { untilMs: 60 * 60_000, everyMs: 60_000 },
];

// Past the last window the thumbnail is treated as never coming.
const GIVE_UP_AFTER_MS = CHECK_SCHEDULE[CHECK_SCHEDULE.length - 1].untilMs;

// ── Types ─────────────────────────────────────────────────────────────────

export type VideoThumbnailState =
  // Render this src (the original URL, or the cache-busted URL that loaded).
  | { status: "ready"; src: string }
  // Failed to load; being re-checked in the background.
  | { status: "pending" }
  // Never loaded within GIVE_UP_AFTER_MS.
  | { status: "gave_up" };

interface PendingEntry {
  markedAt: number;
  nextCheckAt: number;
  probing: boolean;
}

// ── Registry state ────────────────────────────────────────────────────────

const PENDING_STATE: VideoThumbnailState = { status: "pending" };
const GAVE_UP_STATE: VideoThumbnailState = { status: "gave_up" };

const pending = new Map<string, PendingEntry>();
// Settled states, kept for the session so remounted cards skip the 404.
const settled = new Map<string, VideoThumbnailState>();
const listeners = new Map<string, Set<() => void>>();

let timer: ReturnType<typeof setTimeout> | undefined;
let wakeListenersAttached = false;

// ── Public API ────────────────────────────────────────────────────────────

/** Mark a video thumbnail URL as failed so it gets re-checked. */
export function markVideoThumbnailFailed(url: string) {
  if (pending.has(url) || settled.get(url) === GAVE_UP_STATE) return;
  const now = Date.now();
  // Also covers a previously loaded src failing again: start over.
  settled.delete(url);
  pending.set(url, {
    markedAt: now,
    nextCheckAt: now + CHECK_SCHEDULE[0].everyMs,
    probing: false,
  });
  attachWakeListeners();
  notify(url);
  scheduleNextTick();
}

export function getVideoThumbnailState(
  url: string,
): VideoThumbnailState | undefined {
  if (pending.has(url)) return PENDING_STATE;
  return settled.get(url);
}

/**
 * The render state for a video thumbnail URL. Untracked URLs render as-is.
 * Pass null to opt out (non-video media, or no thumbnail).
 */
export function useVideoThumbnailState(
  url: string | null,
): VideoThumbnailState | undefined {
  return useSyncExternalStore(
    (onChange) => (url ? subscribe(url, onChange) : () => {}),
    () => (url ? getVideoThumbnailState(url) : undefined),
  );
}

/** Test-only: forget all tracked thumbnails and stop the checker. */
export function resetVideoThumbnailsForTests() {
  pending.clear();
  settled.clear();
  listeners.clear();
  if (timer) clearTimeout(timer);
  timer = undefined;
}

// ── Checker ───────────────────────────────────────────────────────────────

function scheduleNextTick() {
  if (timer) clearTimeout(timer);
  timer = undefined;
  if (pending.size === 0) return;
  let earliest = Infinity;
  for (const entry of pending.values()) {
    if (!entry.probing) earliest = Math.min(earliest, entry.nextCheckAt);
  }
  if (earliest === Infinity) return; // Every entry is mid-probe.
  timer = setTimeout(tick, Math.max(0, earliest - Date.now()));
}

function tick() {
  timer = undefined;
  // Paused while the window is hidden; the wake listeners resume it.
  if (typeof document !== "undefined" && document.hidden) return;
  const now = Date.now();
  for (const [url, entry] of pending) {
    if (entry.probing || entry.nextCheckAt > now) continue;
    if (now - entry.markedAt >= GIVE_UP_AFTER_MS) {
      pending.delete(url);
      settled.set(url, GAVE_UP_STATE);
      notify(url);
      continue;
    }
    probe(url, entry);
  }
  scheduleNextTick();
}

function probe(url: string, entry: PendingEntry) {
  entry.probing = true;
  const src = withCacheBust(url);
  const img = new Image();
  img.onload = () => {
    if (pending.get(url) !== entry) return; // Reset while in flight.
    pending.delete(url);
    settled.set(url, { status: "ready", src });
    notify(url);
    scheduleNextTick();
  };
  img.onerror = () => {
    if (pending.get(url) !== entry) return;
    entry.probing = false;
    entry.nextCheckAt = Date.now() + checkInterval(Date.now() - entry.markedAt);
    scheduleNextTick();
  };
  img.src = src;
}

function checkInterval(ageMs: number): number {
  const slot = CHECK_SCHEDULE.find((w) => ageMs < w.untilMs);
  return (slot ?? CHECK_SCHEDULE[CHECK_SCHEDULE.length - 1]).everyMs;
}

// Re-check everything immediately when the app comes back into view or focus
// (the desktop window rarely fires visibilitychange, but does fire focus).
function attachWakeListeners() {
  if (wakeListenersAttached || typeof window === "undefined") return;
  wakeListenersAttached = true;
  const wake = () => {
    if (document.hidden || pending.size === 0) return;
    const now = Date.now();
    for (const entry of pending.values()) {
      entry.nextCheckAt = Math.min(entry.nextCheckAt, now);
    }
    scheduleNextTick();
  };
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("focus", wake);
}

// ── Subscriptions ─────────────────────────────────────────────────────────

function subscribe(url: string, onChange: () => void) {
  let set = listeners.get(url);
  if (!set) {
    set = new Set();
    listeners.set(url, set);
  }
  set.add(onChange);
  return () => {
    set.delete(onChange);
    if (set.size === 0) listeners.delete(url);
  };
}

function notify(url: string) {
  listeners.get(url)?.forEach((cb) => cb());
}

function withCacheBust(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("_r", Date.now().toString());
    return parsed.toString();
  } catch {
    return `${url}${url.includes("?") ? "&" : "?"}_r=${Date.now()}`;
  }
}
