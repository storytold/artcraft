/**
 * Hacky and temporary lightweight cache that stores enqueue metadata (prompt, ref image thumbnails)
 * so failed/in-progress tasks in the TaskQueue can display them.
 *
 * Keyed by approximate timestamp + model type because the Rust backend
 * does not expose the frontend_subscriber_id on TaskQueueItem responses.
 *
 * Ref images are converted to small base64 thumbnails at store time so they
 * survive page refreshes (blob URLs do not).
 */

const STORAGE_KEY = "task_enqueue_meta";
const MAX_ENTRIES = 100;
const MATCH_WINDOW_MS = 30_000; // 30-second window for timestamp matching
const THUMB_SIZE = 144; // px – 2x the 72px card thumbnail for retina

export interface EnqueueMeta {
  prompt?: string;
  refImageUrls?: string[];
  modelType?: string;
  timestamp: number; // Date.now() at enqueue time
}

interface StoredEntry {
  id: string;
  prompt?: string;
  refImageUrls?: string[]; // base64 data-URLs after conversion
  modelType?: string;
  timestamp: number;
  matchedTaskId?: string; // set once matched to a specific task
}

interface TaskMatch {
  prompt?: string;
  refImageUrls?: string[];
}

// In-memory cache of task_id → matched metadata
const matchedTasks = new Map<string, TaskMatch>();

function readEntries(): StoredEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: StoredEntry[]) {
  const trimmed = entries.slice(-MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full – drop oldest half and retry
    const half = trimmed.slice(Math.floor(trimmed.length / 2));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch {
      // give up
    }
  }
}

let entryCounter = 0;

/**
 * Convert a blob/object URL to a small base64 data-URL thumbnail.
 * Returns the original URL if conversion fails (e.g. CORS, non-image).
 */
function toBase64Thumb(url: string): Promise<string> {
  return new Promise((resolve) => {
    // Already a data URL — keep as-is
    if (url.startsWith("data:")) {
      resolve(url);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(THUMB_SIZE / img.width, THUMB_SIZE / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(url);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

/**
 * Call this at enqueue time to store the prompt + ref image URLs.
 * Blob URLs are asynchronously converted to base64 thumbnails for persistence.
 */
export function storeEnqueueMeta(meta: EnqueueMeta) {
  const entryId = `${Date.now()}_${entryCounter++}`;

  // Write immediately with original URLs so same-session lookups work
  const entry: StoredEntry = {
    id: entryId,
    prompt: meta.prompt,
    refImageUrls: meta.refImageUrls,
    modelType: meta.modelType,
    timestamp: meta.timestamp,
  };
  const entries = readEntries();
  entries.push(entry);
  writeEntries(entries);

  // Then convert blob URLs to base64 in the background for persistence
  if (meta.refImageUrls && meta.refImageUrls.length > 0) {
    Promise.all(meta.refImageUrls.map(toBase64Thumb)).then((dataUrls) => {
      const current = readEntries();
      const found = current.find((e) => e.id === entryId);
      if (found) {
        found.refImageUrls = dataUrls;
        writeEntries(current);
      }
    });
  }
}

/**
 * Try to match a task to stored enqueue metadata.
 * Uses timestamp proximity + model type matching.
 * Once matched, the entry stores the taskId so it survives page refresh.
 */
export function getMetaForTask(
  taskId: string,
  modelType: string | undefined,
  createdAtMs: number,
): TaskMatch | undefined {
  // Check in-memory cache first
  const cached = matchedTasks.get(taskId);
  if (cached) return cached;

  const entries = readEntries();

  // First check if this task was already matched in a previous session
  const previousMatch = entries.find((e) => e.matchedTaskId === taskId);
  if (previousMatch) {
    const result: TaskMatch = {
      prompt: previousMatch.prompt,
      refImageUrls: previousMatch.refImageUrls,
    };
    matchedTasks.set(taskId, result);
    return result;
  }

  // Otherwise find the best unmatched entry by timestamp + model proximity
  let bestIdx = -1;
  let bestDiff = Infinity;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.matchedTaskId) continue; // already matched to another task

    const entryModel = entry.modelType?.toLowerCase();
    const taskModel = modelType?.toLowerCase();
    if (entryModel !== taskModel) continue;

    const diff = Math.abs(entry.timestamp - createdAtMs);
    if (diff < MATCH_WINDOW_MS && diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }

  if (bestIdx === -1) return undefined;

  // Mark as matched with this taskId (persists across refresh)
  entries[bestIdx].matchedTaskId = taskId;
  writeEntries(entries);

  const matched = entries[bestIdx];
  const result: TaskMatch = {
    prompt: matched.prompt,
    refImageUrls: matched.refImageUrls,
  };
  matchedTasks.set(taskId, result);
  return result;
}

/**
 * Clean up old entries (older than 24 hours).
 */
export function cleanupOldEntries() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const entries = readEntries().filter((e) => e.timestamp > cutoff);
  writeEntries(entries);
}

// Expose globally so libs/ packages can call without cross-package imports.
declare global {
  interface Window {
    __storeTaskEnqueueMeta?: (meta: EnqueueMeta) => void;
  }
}
window.__storeTaskEnqueueMeta = storeEnqueueMeta;
