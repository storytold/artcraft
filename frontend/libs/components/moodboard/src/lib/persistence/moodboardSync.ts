import { useEffect, useState } from "react";
import { create } from "zustand";
import { useBoardLibraryStore } from "../boards/BoardLibraryStore";
import { useMoodboardStore } from "../canvas/MoodboardStore";
import type {
  MoodboardAdapter,
  MoodboardPersistenceAdapter,
} from "../adapter";
import {
  applyResolvedMediaUrls,
  collectUnresolvedMediaTokens,
  deserializeMoodboardDocument,
  serializeMoodboardDocument,
  EMPTY_CANVAS_DOCUMENT,
} from "./documents";
import {
  applyCanvasDocument,
  captureCanvasDocument,
  dropCanvasForBoard,
  getCanvasForBoard,
  setCanvasForBoard,
} from "./canvasBridge";
import { isDirtySuppressed, withDirtySuppressed } from "./dirtySuppression";

// Remote sync controller. Mounted (via useMoodboardSync) by the workspace
// when the adapter provides persistence and the user is signed in:
//  - on mount, hydrates boards from the server (server wins for boards
//    already linked by token — the canvas half never persists locally, and
//    linked boards autosave, so the server copy is the richer one);
//  - subscribes to both stores and autosaves dirty boards (debounced);
//  - exposes saveNow() for the manual Save button, plus a status signal.

const AUTOSAVE_DEBOUNCE_MS = 2000;

export type MoodboardSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface MoodboardSyncState {
  status: MoodboardSaveStatus;
  setStatus: (status: MoodboardSaveStatus) => void;
}

export const useMoodboardSyncStore = create<MoodboardSyncState>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));

// ---------- module-level controller state ----------

let persistenceRef: MoodboardPersistenceAdapter | null = null;
const dirtyBoardIds = new Set<string>();
let canvasDirty = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let isSaving = false;
let hasPendingFlush = false;
let hydratedThisPageLoad = false;

const setStatus = (status: MoodboardSaveStatus) =>
  useMoodboardSyncStore.getState().setStatus(status);

// ---------- public surface ----------

export function useMoodboardSync(adapter: MoodboardAdapter): {
  enabled: boolean;
  status: MoodboardSaveStatus;
  saveNow: () => void;
} {
  const status = useMoodboardSyncStore((s) => s.status);
  const persistence = adapter.persistence;

  // Login state resolves asynchronously (the session fetch may still be in
  // flight when the workspace mounts), so track it reactively instead of
  // sampling once.
  const [loggedIn, setLoggedIn] = useState(() =>
    Boolean(persistence?.isLoggedIn()),
  );
  useEffect(() => {
    if (!persistence) return undefined;
    const update = () => setLoggedIn(persistence.isLoggedIn());
    update();
    return persistence.subscribeLoginState?.(update);
  }, [persistence]);

  useEffect(() => {
    if (!persistence || !loggedIn) return undefined;
    persistenceRef = persistence;

    if (!hydratedThisPageLoad) {
      hydratedThisPageLoad = true;
      void hydrateRemoteBoards(persistence);
    }

    const unsubscribeBoards = useBoardLibraryStore.subscribe((state, prev) => {
      if (isDirtySuppressed()) return;
      if (state.boards === prev.boards) return;
      for (const [id, board] of Object.entries(state.boards)) {
        if (prev.boards[id] !== board) markBoardDirty(id);
      }
    });

    const unsubscribeCanvas = useMoodboardStore.subscribe((state, prev) => {
      if (isDirtySuppressed()) return;
      if (
        state.nodes !== prev.nodes ||
        state.rootOrder !== prev.rootOrder ||
        state.viewport !== prev.viewport ||
        state.snapEnabled !== prev.snapEnabled
      ) {
        canvasDirty = true;
        scheduleFlush();
        setStatusIfIdle("dirty");
      }
    });

    return () => {
      unsubscribeBoards();
      unsubscribeCanvas();
    };
  }, [persistence, loggedIn]);

  return { enabled: Boolean(persistence) && loggedIn, status, saveNow: flushNow };
}

// Immediate save of everything dirty (manual Save button). Also saves the
// active board even when nothing is marked dirty, so the button always
// produces a fresh server copy.
export function flushNow(): void {
  const activeId = useBoardLibraryStore.getState().activeBoardId;
  if (activeId) dirtyBoardIds.add(activeId);
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  void flush();
}

// Delete a board locally and (when linked) remotely. Used by the board
// picker so a deleted board doesn't resurrect on the next hydration.
export async function deleteBoardEverywhere(boardId: string): Promise<void> {
  const store = useBoardLibraryStore.getState();
  const token = store.boards[boardId]?.remoteToken;
  store.deleteBoard(boardId);
  dropCanvasForBoard(boardId);
  dirtyBoardIds.delete(boardId);
  if (token && persistenceRef?.deleteBoard) {
    try {
      await persistenceRef.deleteBoard(token);
    } catch (error) {
      console.error("[Moodboard] remote board delete failed:", error);
    }
  }
}

// ---------- internals ----------

function markBoardDirty(boardId: string): void {
  dirtyBoardIds.add(boardId);
  scheduleFlush();
  setStatusIfIdle("dirty");
}

function setStatusIfIdle(status: MoodboardSaveStatus): void {
  const current = useMoodboardSyncStore.getState().status;
  if (current !== "saving") setStatus(status);
}

function scheduleFlush(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flush();
  }, AUTOSAVE_DEBOUNCE_MS);
}

async function flush(): Promise<void> {
  if (isSaving) {
    hasPendingFlush = true;
    return;
  }
  const persistence = persistenceRef;
  if (!persistence || !persistence.isLoggedIn()) return;

  // Canvas edits belong to the active board, resolved at save time.
  if (canvasDirty) {
    canvasDirty = false;
    const activeId = useBoardLibraryStore.getState().activeBoardId;
    if (activeId) dirtyBoardIds.add(activeId);
  }
  if (dirtyBoardIds.size === 0) return;

  isSaving = true;
  setStatus("saving");
  let hadError = false;

  try {
    const ids = Array.from(dirtyBoardIds);
    dirtyBoardIds.clear();
    for (const id of ids) {
      const ok = await saveBoard(persistence, id);
      if (!ok) hadError = true;
    }
  } finally {
    isSaving = false;
  }

  setStatus(hadError ? "error" : "saved");

  if (hasPendingFlush || dirtyBoardIds.size > 0 || canvasDirty) {
    hasPendingFlush = false;
    scheduleFlush();
  }
}

async function saveBoard(
  persistence: MoodboardPersistenceAdapter,
  boardId: string,
): Promise<boolean> {
  const state = useBoardLibraryStore.getState();
  const board = state.boards[boardId];
  if (!board) return true;

  const canvas =
    boardId === state.activeBoardId
      ? captureCanvasDocument()
      : (getCanvasForBoard(boardId) ?? EMPTY_CANVAS_DOCUMENT);

  // Never-saved boards with no content and the default name are just the
  // auto-created scratch board — creating a server row for every visit (and
  // every new device) would litter the project list with empty untitleds.
  const isUntouched =
    !board.remoteToken &&
    board.itemOrder.length === 0 &&
    board.sections.length === 0 &&
    board.name === "Untitled board" &&
    canvas.rootOrder.length === 0;
  if (isUntouched) return true;

  const documentJson = JSON.stringify(
    serializeMoodboardDocument({ board, canvas }),
  );

  try {
    const result = await persistence.saveBoard({
      token: board.remoteToken ?? null,
      name: board.name,
      documentJson,
    });
    if (!result.success) {
      console.error("[Moodboard] board save failed:", result.errorMessage);
      return false;
    }
    if (result.token && !board.remoteToken) {
      withDirtySuppressed(() => {
        useBoardLibraryStore
          .getState()
          .setBoardRemoteToken(boardId, result.token as string);
      });
    }
    return true;
  } catch (error) {
    console.error("[Moodboard] board save failed:", error);
    return false;
  }
}

async function hydrateRemoteBoards(
  persistence: MoodboardPersistenceAdapter,
): Promise<void> {
  try {
    const listed = await persistence.listBoards();
    if (!listed.success || !listed.boards) return;

    for (const remote of listed.boards) {
      const loaded = await persistence.loadBoard(remote.token);
      if (!loaded.success || !loaded.documentJson) continue;

      let boardDocument = deserializeMoodboardDocument(loaded.documentJson);
      if (!boardDocument) continue;

      const unresolved = collectUnresolvedMediaTokens(boardDocument);
      if (unresolved.length > 0 && persistence.resolveMediaUrls) {
        try {
          const urls = await persistence.resolveMediaUrls(unresolved);
          boardDocument = applyResolvedMediaUrls(boardDocument, urls);
        } catch (error) {
          console.error("[Moodboard] media URL resolution failed:", error);
        }
      }

      const doc = boardDocument;
      withDirtySuppressed(() => {
        const boardId = useBoardLibraryStore.getState().upsertRemoteBoard({
          token: remote.token,
          name: remote.name,
          itemOrder: doc.board.itemOrder,
          items: doc.board.items,
          sections: doc.board.sections,
        });
        setCanvasForBoard(boardId, doc.canvas);
        // The user is looking at this board: swap the live canvas in too.
        // Fresh page loads start with an empty canvas (it never persists
        // locally), so this can't clobber unsaved work.
        if (boardId === useBoardLibraryStore.getState().activeBoardId) {
          applyCanvasDocument(doc.canvas);
        }
      });
    }
  } catch (error) {
    console.error("[Moodboard] board hydration failed:", error);
  }
}

