import type {
  HistoryNodeData,
  LineNode,
  SerializedDrawNode,
} from "../stores/SceneState";
import { AspectRatioType } from "../stores/SceneState";

// Durable local replica of pagedraw sessions, one record per session. This is
// the crash/reload safety net AND the home of the undo history (history is
// local-durable by design — it does not travel to the server).
//
// IndexedDB rather than localStorage because records carry File blobs (local
// images that haven't been uploaded yet) and history snapshots that can far
// exceed the ~5MB localStorage quota. Files structured-clone into IDB
// natively — no base64 inflation. The tradeoff: IDB writes are async, so
// unlike the moodboard's synchronous pagehide flush, the last <1s of edits
// before a hard kill can be lost. Writes are debounced tightly and fired
// (not awaited) on pagehide to keep that window minimal.

const DB_NAME = "artcraft_pagedraw";
const DB_VERSION = 1;
const STORE_NAME = "sessions";

// History snapshots dominate record size; keep a bounded tail. 50 entries
// comfortably covers a working session's undo needs.
export const REPLICA_HISTORY_LIMIT = 50;

/** Key for the per-account unnamed scratch session. */
export const draftKey = (ownerId: string | null): string =>
  `draft:${ownerId ?? "anon"}`;

export interface PageDrawSessionRecord {
  /** Primary key: the server token for named sessions, else a draft key. */
  key: string;
  /**
   * Account this session belongs to (null = signed-out work). Replicas are
   * machine-shared, so the sync layer refuses to push records owned by a
   * different account.
   */
  ownerId: string | null;
  name: string;
  remoteToken: string | null;
  /**
   * Server `updated_at` this replica last hydrated from or pushed to — the
   * base revision for multi-device conflict detection. Null before the first
   * successful sync.
   */
  baseRevision: string | null;
  /** True when local edits haven't reached the server yet. */
  needsSync: boolean;
  /** Client wall-clock of the last replica write. */
  savedAt: number;
  drawNodes: SerializedDrawNode[];
  inpaintLineNodes: LineNode[];
  brushColor: string;
  brushSize: number;
  fillColor: string;
  aspectRatioType: AspectRatioType;
  /**
   * Bounded undo-history tail (see REPLICA_HISTORY_LIMIT) plus the index into
   * it. When the live history is truncated to fit, the index is clamped: an
   * index of -1 in a truncated window means "at the window's start", not
   * necessarily "empty canvas".
   */
  history: HistoryNodeData[];
  historyIndex: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

const openDb = (): Promise<IDBDatabase | null> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error("[PageDraw] replica DB open failed", request.error);
        resolve(null);
      };
      request.onblocked = () => resolve(null);
    } catch (error) {
      console.error("[PageDraw] replica DB open threw", error);
      resolve(null);
    }
  });
  return dbPromise;
};

/** Read one session record; null when absent or on any storage failure. */
export const readSessionRecord = async (
  key: string,
): Promise<PageDrawSessionRecord | null> => {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const request = db
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(key);
      request.onsuccess = () =>
        resolve((request.result as PageDrawSessionRecord | undefined) ?? null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

/**
 * Write a session record, truncating history to the bounded tail. Resolves
 * false on failure — callers keep needsSync semantics in the record itself,
 * so a failed write just means the previous replica generation survives.
 */
export const writeSessionRecord = async (
  record: PageDrawSessionRecord,
): Promise<boolean> => {
  const db = await openDb();
  if (!db) return false;

  const start = Math.max(0, record.history.length - REPLICA_HISTORY_LIMIT);
  const bounded: PageDrawSessionRecord =
    start === 0
      ? record
      : {
          ...record,
          history: record.history.slice(start),
          historyIndex: Math.min(
            Math.max(record.historyIndex - start, -1),
            record.history.length - start - 1,
          ),
        };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(bounded);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error("[PageDraw] replica write failed", tx.error);
        resolve(false);
      };
      tx.onabort = () => resolve(false);
    } catch (error) {
      console.error("[PageDraw] replica write threw", error);
      resolve(false);
    }
  });
};

export const deleteSessionRecord = async (key: string): Promise<boolean> => {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

/** All stored session records (for resume-pending-sync and future UI). */
export const listSessionRecords = async (): Promise<PageDrawSessionRecord[]> => {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const request = db
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .getAll();
      request.onsuccess = () =>
        resolve((request.result as PageDrawSessionRecord[]) ?? []);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
};

// Which session the page should reopen on next visit. Tiny and synchronous,
// so it lives in localStorage rather than IDB.
const LAST_ACTIVE_STORAGE_KEY = "artcraft_pagedraw_last_session_v1";

export const readLastActiveKey = (ownerId: string | null): string | null => {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[ownerId ?? "anon"] ?? null;
  } catch {
    return null;
  }
};

export const writeLastActiveKey = (
  ownerId: string | null,
  key: string | null,
): void => {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (key === null) delete map[ownerId ?? "anon"];
    else map[ownerId ?? "anon"] = key;
    localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Non-fatal: next visit starts fresh instead of resuming.
  }
};
