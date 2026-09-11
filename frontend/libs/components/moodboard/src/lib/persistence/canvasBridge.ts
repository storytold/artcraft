import { useMoodboardStore } from "../canvas/MoodboardStore";
import { useMoodboardHistoryStore } from "../canvas/MoodboardHistoryStore";
import { useBoardLibraryStore } from "../boards/BoardLibraryStore";
import { withDirtySuppressed } from "./dirtySuppression";
import {
  EMPTY_CANVAS_DOCUMENT,
  persistableCanvas,
  type MoodboardCanvasDocument,
} from "./documents";

// The Konva canvas store is a single global surface with no board concept.
// This bridge keys canvas documents by board id and mirrors them to
// localStorage, making the canvas a durable local replica just like the
// grid model (which the board store already persists):
//  - switching boards swaps the live canvas through the map;
//  - a reload restores each board's canvas instead of starting empty — so
//    there is never a window where an "empty because it just loaded" canvas
//    can masquerade as user intent and overwrite real content anywhere;
//  - the sync layer serializes map entries, never a maybe-stale live view.
// Blob-URL nodes are stripped at the storage boundary (object URLs die with
// the page); the in-memory map keeps them so within-session switches are
// lossless.

const CANVAS_STORAGE_KEY = "artcraft_moodboard_canvas_v1";
const PERSIST_DEBOUNCE_MS = 500;

const canvasByBoard = new Map<string, MoodboardCanvasDocument>();
let loadedFromStorage = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function captureCanvasDocument(): MoodboardCanvasDocument {
  const state = useMoodboardStore.getState();
  return structuredClone({
    nodes: state.nodes,
    rootOrder: state.rootOrder,
    viewport: state.viewport,
    canvasSize: state.canvasSize,
    gridSpacing: state.gridSpacing,
    snapEnabled: state.snapEnabled,
  });
}

// Replaces the live canvas. Restores nodes, order, viewport (pan + zoom),
// grid spacing, and snap; selection and undo history reset. canvasSize is
// deliberately not applied — the stage re-measures its container. Runs with
// dirty tracking suppressed: swapping a board's canvas in is not an edit.
export function applyCanvasDocument(
  document: MoodboardCanvasDocument | null,
): void {
  const doc = document ?? EMPTY_CANVAS_DOCUMENT;
  withDirtySuppressed(() => {
    useMoodboardHistoryStore.getState().clear();
    useMoodboardStore.setState({
      nodes: structuredClone(doc.nodes),
      rootOrder: [...doc.rootOrder],
      selectedIds: new Set(),
      viewport: structuredClone(doc.viewport),
      gridSpacing: doc.gridSpacing,
      snapEnabled: doc.snapEnabled,
    });
  });
}

export function setCanvasForBoard(
  boardId: string,
  document: MoodboardCanvasDocument,
): void {
  ensureLoaded();
  canvasByBoard.set(boardId, document);
  schedulePersist();
}

export function getCanvasForBoard(
  boardId: string,
): MoodboardCanvasDocument | null {
  ensureLoaded();
  return canvasByBoard.get(boardId) ?? null;
}

export function dropCanvasForBoard(boardId: string): void {
  ensureLoaded();
  canvasByBoard.delete(boardId);
  schedulePersist();
}

// Stash the live canvas under the given board id (the owner of what's on
// screen). Called by the sync layer whenever the canvas changes, and by the
// switch flow before swapping boards.
export function stashLiveCanvas(boardId: string): void {
  setCanvasForBoard(boardId, captureCanvasDocument());
}

// Restore the live canvas from the replica on page load. Applied once by
// the workspace mount; a no-op when the board has no stored canvas.
export function restoreLiveCanvasForBoard(boardId: string | null): void {
  if (!boardId) return;
  const stored = getCanvasForBoard(boardId);
  if (stored) applyCanvasDocument(stored);
}

// Board-switch handoff: stash the live canvas under the outgoing board, then
// apply the incoming board's canvas (or a blank one).
export function switchCanvasBetweenBoards({
  fromBoardId,
  toBoardId,
}: {
  fromBoardId: string | null;
  toBoardId: string;
}): void {
  if (fromBoardId && fromBoardId !== toBoardId) {
    stashLiveCanvas(fromBoardId);
  }
  applyCanvasDocument(getCanvasForBoard(toBoardId));
}

// Activate another board, swapping the canvas along with it.
export function switchActiveBoard(boardId: string): void {
  const store = useBoardLibraryStore.getState();
  if (store.activeBoardId === boardId || !store.boards[boardId]) return;
  switchCanvasBetweenBoards({
    fromBoardId: store.activeBoardId,
    toBoardId: boardId,
  });
  store.setActiveBoard(boardId);
}

// Create + activate a fresh board with a blank canvas.
export function createBoardAndSwitch(): string {
  const store = useBoardLibraryStore.getState();
  const fromBoardId = store.activeBoardId;
  const boardId = store.createBoard();
  switchCanvasBetweenBoards({ fromBoardId, toBoardId: boardId });
  return boardId;
}

// Synchronous write for pagehide/teardown — the debounce must not be the
// reason a closing tab loses its last edit.
export function persistCanvasReplicaNow(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  writeToStorage();
}

// ---------- helpers ----------

function ensureLoaded(): void {
  if (loadedFromStorage) return;
  loadedFromStorage = true;
  try {
    const raw = localStorage.getItem(CANVAS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, MoodboardCanvasDocument>;
    for (const [boardId, doc] of Object.entries(parsed)) {
      canvasByBoard.set(boardId, { ...EMPTY_CANVAS_DOCUMENT, ...doc });
    }
  } catch (error) {
    console.error("[Moodboard] canvas replica load failed:", error);
  }
}

function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    writeToStorage();
  }, PERSIST_DEBOUNCE_MS);
}

function writeToStorage(): void {
  try {
    const serializable: Record<string, MoodboardCanvasDocument> = {};
    for (const [boardId, doc] of canvasByBoard.entries()) {
      serializable[boardId] = persistableCanvas(doc);
    }
    localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    // Quota or serialization failure: the in-memory map still covers the
    // session; the server replica covers durability for synced boards.
    console.error("[Moodboard] canvas replica persist failed:", error);
  }
}
