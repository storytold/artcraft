import { useEffect, useState } from "react";
import { create } from "zustand";
import { useBoardLibraryStore } from "../boards/BoardLibraryStore";
import type { Board } from "../boards/boardTypes";
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
  dropCanvasForBoard,
  getCanvasForBoard,
  persistCanvasReplicaNow,
  restoreLiveCanvasForBoard,
  setCanvasForBoard,
  stashLiveCanvas,
} from "./canvasBridge";
import { isDirtySuppressed, withDirtySuppressed } from "./dirtySuppression";

// Remote sync controller. Both the grid model and the canvas are durable
// LOCAL replicas (board store → zustand persist; canvas → canvasBridge), so
// sync is a replication problem, not a fetch-and-push:
//
//  - Saves are gated behind hydration ("ready" phase): nothing is ever
//    pushed from a partially loaded session, so a just-loaded state can
//    never overwrite real server content.
//  - Dirty state is per board and durable (Board.needsSync persists), so a
//    closed tab resumes its pending push next session and hydration knows
//    when local content is newer than the server copy.
//  - Hydration is dirty-aware last-write-wins: clean boards take the server
//    copy; dirty boards keep local content and push it instead. It never
//    clobbers unsaved work.
//  - Sync is scoped per account: hydration re-runs on account change, and a
//    board stamped with another account's ownerId is never pushed
//    (localStorage is machine-shared; server rows are not).
//  - Failed pushes stay dirty and retry with exponential backoff. Deletes
//    are tombstoned so a board removed while offline can't resurrect from
//    the server on the next hydration.

const AUTOSAVE_DEBOUNCE_MS = 2000;
const RETRY_BASE_MS = 5000;
const RETRY_MAX_MS = 60_000;
const HYDRATE_CONCURRENCY = 4;
const TOMBSTONE_STORAGE_KEY = "artcraft_moodboard_deleted_tokens_v1";
const DEFAULT_BOARD_NAME = "Untitled board";

export type MoodboardSaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

interface MoodboardSyncState {
  status: MoodboardSaveStatus;
  setStatus: (status: MoodboardSaveStatus) => void;
}

export const useMoodboardSyncStore = create<MoodboardSyncState>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));

// ---------- module-level controller state ----------

type SyncPhase = "idle" | "hydrating" | "ready";

let persistenceRef: MoodboardPersistenceAdapter | null = null;
let syncPhase: SyncPhase = "idle";
// Account the current hydration/ready phase belongs to. A change of user
// resets the machine and re-hydrates.
let syncUserId: string | null = null;
const dirtyBoardIds = new Set<string>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let isSaving = false;
let hasPendingFlush = false;
let retryAttempt = 0;
let pageHideHooked = false;
let restoredLiveCanvas = false;

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

  // The session resolves asynchronously, so track the account reactively —
  // a boolean sampled once would miss both late logins and account
  // switches.
  const [userId, setUserId] = useState<string | null>(
    () => persistence?.getUserId() ?? null,
  );
  useEffect(() => {
    if (!persistence) return undefined;
    const update = () => setUserId(persistence.getUserId());
    update();
    return persistence.subscribeAuthState?.(update);
  }, [persistence]);

  // Local-replica wiring, active regardless of login: restore the active
  // board's canvas from storage on first mount, keep the replica stashed as
  // the canvas changes, and flush it synchronously when the page hides.
  useEffect(() => {
    restoreLiveCanvasOnce();
    hookPageHide();

    const unsubscribeCanvas = useMoodboardStore.subscribe((state, prev) => {
      if (isDirtySuppressed()) return;
      if (
        state.nodes === prev.nodes &&
        state.rootOrder === prev.rootOrder &&
        state.viewport === prev.viewport &&
        state.snapEnabled === prev.snapEnabled
      ) {
        return;
      }
      // Attribute the edit to the board that owns the canvas RIGHT NOW —
      // resolving later (at flush time) would blame whichever board the
      // user had switched to meanwhile.
      const boardId = useBoardLibraryStore.getState().activeBoardId;
      if (!boardId) return;
      stashLiveCanvas(boardId);
      markBoardDirty(boardId);
    });

    const unsubscribeBoards = useBoardLibraryStore.subscribe((state, prev) => {
      if (isDirtySuppressed()) return;
      if (state.boards === prev.boards) return;
      for (const [id, board] of Object.entries(state.boards)) {
        if (prev.boards[id] !== board) markBoardDirty(id);
      }
    });

    return () => {
      unsubscribeCanvas();
      unsubscribeBoards();
    };
  }, []);

  // Server sync, gated on a signed-in account.
  useEffect(() => {
    persistenceRef = persistence ?? null;
    if (!persistence || !userId) {
      // Logged out (or logged out mid-session): stop pushing. Local
      // replicas and needsSync flags stay — pushes resume on login.
      syncPhase = "idle";
      clearSaveTimer();
      return;
    }

    if (syncUserId !== userId) {
      // First login of this page load, or an account switch: reset the
      // machine and hydrate for this user. Dirty bookkeeping is rebuilt
      // from the durable needsSync flags.
      syncUserId = userId;
      syncPhase = "hydrating";
      clearSaveTimer();
      dirtyBoardIds.clear();
      retryAttempt = 0;
      seedDirtyFromDurableFlags(userId);
      void hydrateRemoteBoards(persistence, userId);
    } else if (syncPhase === "ready") {
      // Same user re-mounting the workspace: nothing to hydrate.
      scheduleFlushIfDirty();
    }
  }, [persistence, userId]);

  return {
    enabled: Boolean(persistence) && userId !== null,
    status,
    saveNow: flushNow,
  };
}

// Immediate save of everything dirty (manual Save button). Also treats the
// active board as dirty so the button always produces a fresh server copy.
export function flushNow(): void {
  const activeId = useBoardLibraryStore.getState().activeBoardId;
  if (activeId) {
    stashLiveCanvas(activeId);
    markBoardDirty(activeId);
  }
  clearSaveTimer();
  void flush();
}

// Delete a board locally and (when linked) remotely. The token is
// tombstoned first so a failed remote delete can't resurrect the board from
// the server on the next hydration — the delete is retried then instead.
export async function deleteBoardEverywhere(boardId: string): Promise<void> {
  const store = useBoardLibraryStore.getState();
  const token = store.boards[boardId]?.remoteToken;
  store.deleteBoard(boardId);
  dropCanvasForBoard(boardId);
  dirtyBoardIds.delete(boardId);
  if (!token) return;

  addTombstone(token);
  if (persistenceRef?.deleteBoard) {
    try {
      const deleted = await persistenceRef.deleteBoard(token);
      if (deleted) removeTombstone(token);
    } catch (error) {
      console.error("[Moodboard] remote board delete failed:", error);
    }
  }
}

// ---------- dirty tracking + scheduling ----------

function markBoardDirty(boardId: string): void {
  dirtyBoardIds.add(boardId);
  // Durable flag: survives reload, and tells hydration that local wins.
  withDirtySuppressed(() => {
    useBoardLibraryStore.getState().markBoardNeedsSync(boardId);
  });
  if (canSaveNow()) {
    scheduleFlush(AUTOSAVE_DEBOUNCE_MS);
  }
  if (useMoodboardSyncStore.getState().status !== "saving") {
    setStatus("dirty");
  }
}

function canSaveNow(): boolean {
  return (
    syncPhase === "ready" &&
    persistenceRef !== null &&
    syncUserId !== null &&
    persistenceRef.getUserId() === syncUserId
  );
}

function scheduleFlush(delayMs: number): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flush();
  }, delayMs);
}

function scheduleFlushIfDirty(): void {
  if (dirtyBoardIds.size > 0) scheduleFlush(AUTOSAVE_DEBOUNCE_MS);
}

function clearSaveTimer(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

function seedDirtyFromDurableFlags(userId: string): void {
  const { boards } = useBoardLibraryStore.getState();
  for (const board of Object.values(boards)) {
    if (board.ownerId && board.ownerId !== userId) continue;
    if (board.needsSync) dirtyBoardIds.add(board.id);
  }
  if (dirtyBoardIds.size > 0) setStatus("dirty");
}

// ---------- flush / save ----------

async function flush(): Promise<void> {
  if (isSaving) {
    hasPendingFlush = true;
    return;
  }
  if (!canSaveNow()) {
    // Not ready yet (still hydrating, or logged out). Dirty state is
    // durable; hydration completion / login re-schedules.
    return;
  }
  const persistence = persistenceRef as MoodboardPersistenceAdapter;
  const userId = syncUserId as string;
  if (dirtyBoardIds.size === 0) {
    setStatus("saved");
    return;
  }

  isSaving = true;
  setStatus("saving");
  const ids = Array.from(dirtyBoardIds);
  dirtyBoardIds.clear();
  const failed: string[] = [];

  try {
    for (const id of ids) {
      const ok = await saveBoard(persistence, userId, id);
      if (!ok) failed.push(id);
    }
  } finally {
    isSaving = false;
  }

  // Failed boards stay dirty and retry with backoff — a transient network
  // error must never silently drop edits from the push queue.
  failed.forEach((id) => dirtyBoardIds.add(id));

  if (failed.length > 0) {
    retryAttempt += 1;
    setStatus("error");
    scheduleFlush(
      Math.min(RETRY_BASE_MS * 2 ** (retryAttempt - 1), RETRY_MAX_MS),
    );
  } else {
    retryAttempt = 0;
    if (dirtyBoardIds.size > 0 || hasPendingFlush) {
      // Edits arrived while saving.
      setStatus("dirty");
      scheduleFlush(AUTOSAVE_DEBOUNCE_MS);
    } else {
      setStatus("saved");
    }
  }
  hasPendingFlush = false;
}

async function saveBoard(
  persistence: MoodboardPersistenceAdapter,
  userId: string,
  boardId: string,
): Promise<boolean> {
  const state = useBoardLibraryStore.getState();
  const board = state.boards[boardId];
  if (!board) return true;

  // Cross-account write protection: a board stamped for another account is
  // never pushed from this one, even though it is visible in the
  // machine-shared local library.
  if (board.ownerId && board.ownerId !== userId) {
    console.warn(
      "[Moodboard] skipping push of board owned by another account:",
      boardId,
    );
    return true;
  }

  // The replica map is the canvas authority; the live canvas is stashed
  // into it on every edit and board switch.
  if (boardId === state.activeBoardId) stashLiveCanvas(boardId);
  const canvas = getCanvasForBoard(boardId) ?? EMPTY_CANVAS_DOCUMENT;

  // Never-touched scratch boards (auto-created empty "Untitled board")
  // don't get server rows — a row per visit would litter the project list.
  const isUntouched =
    !board.remoteToken &&
    board.itemOrder.length === 0 &&
    board.sections.length === 0 &&
    board.name === DEFAULT_BOARD_NAME &&
    canvas.rootOrder.length === 0;
  if (isUntouched) {
    withDirtySuppressed(() => {
      useBoardLibraryStore.getState().markBoardSynced(boardId, {
        ownerId: userId,
      });
    });
    return true;
  }

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
    withDirtySuppressed(() => {
      const store = useBoardLibraryStore.getState();
      if (result.token && !board.remoteToken) {
        store.setBoardRemoteToken(boardId, result.token);
      }
      // Only clear the durable dirty flag if nothing changed while the
      // save was in flight — a mid-save edit re-marked it and must
      // survive to the next push. Board content fields are compared (not
      // identity, which sync's own token write-back churns); the canvas
      // is compared by replica-entry reference (every stash replaces it).
      const canvasUnchanged =
        (getCanvasForBoard(boardId) ?? EMPTY_CANVAS_DOCUMENT) === canvas;
      if (!boardEditedSince(board, boardId) && canvasUnchanged) {
        store.markBoardSynced(boardId, { ownerId: userId });
      }
    });
    return true;
  } catch (error) {
    console.error("[Moodboard] board save failed:", error);
    return false;
  }
}

// True when the board's content changed after `snapshot` was captured.
// Compares content fields, not identity — sync's own bookkeeping writes
// (token write-back) change identity without changing content.
function boardEditedSince(snapshot: Board, boardId: string): boolean {
  const current = useBoardLibraryStore.getState().boards[boardId];
  if (!current) return false;
  return (
    current.items !== snapshot.items ||
    current.itemOrder !== snapshot.itemOrder ||
    current.sections !== snapshot.sections ||
    current.name !== snapshot.name
  );
}

// ---------- hydration ----------

async function hydrateRemoteBoards(
  persistence: MoodboardPersistenceAdapter,
  userId: string,
): Promise<void> {
  try {
    const listed = await persistence.listBoards();
    // Abandon silently if the account changed mid-flight.
    if (syncUserId !== userId) return;

    if (listed.success && listed.boards) {
      await retryTombstonedDeletes(persistence);
      const tombstones = readTombstones();
      const rows = listed.boards.filter((row) => !tombstones.has(row.token));

      // Each board hydrates independently — one bad row/fetch must not
      // strand every board after it.
      await mapWithConcurrency(rows, HYDRATE_CONCURRENCY, async (row) => {
        try {
          await hydrateBoard(persistence, userId, row.token, row.name);
        } catch (error) {
          console.error(
            "[Moodboard] board hydration failed:",
            row.token,
            error,
          );
        }
      });
    } else {
      console.error("[Moodboard] board list failed; pushing dirty only");
    }
  } catch (error) {
    console.error("[Moodboard] hydration failed:", error);
  } finally {
    if (syncUserId === userId) {
      syncPhase = "ready";
      // Adopt content-bearing local boards that never reached the server
      // (created logged-out, or before sync existed) so signing in
      // uploads them rather than leaving them stranded on this machine.
      seedUnsyncedLocalBoards(userId);
      if (dirtyBoardIds.size > 0) {
        setStatus("dirty");
        scheduleFlush(AUTOSAVE_DEBOUNCE_MS);
      } else {
        setStatus("saved");
      }
    }
  }
}

async function hydrateBoard(
  persistence: MoodboardPersistenceAdapter,
  userId: string,
  token: string,
  name: string,
): Promise<void> {
  const local = Object.values(useBoardLibraryStore.getState().boards).find(
    (b) => b.remoteToken === token,
  );

  // Dirty-aware LWW: unsaved local edits win — they are strictly newer
  // than the server copy from this device's perspective, and the pending
  // push reconciles the server. Applying the server copy here would
  // destroy them.
  if (local?.needsSync) {
    dirtyBoardIds.add(local.id);
    return;
  }
  // Owned by a different account: hands off entirely.
  if (local?.ownerId && local.ownerId !== userId) return;

  const loaded = await persistence.loadBoard(token);
  if (syncUserId !== userId) return;
  if (!loaded.success || !loaded.documentJson) return;

  let doc = deserializeMoodboardDocument(loaded.documentJson);
  if (!doc) return;

  const unresolved = collectUnresolvedMediaTokens(doc);
  if (unresolved.length > 0 && persistence.resolveMediaUrls) {
    try {
      const urls = await persistence.resolveMediaUrls(unresolved);
      doc = applyResolvedMediaUrls(doc, urls);
    } catch (error) {
      console.error("[Moodboard] media URL resolution failed:", error);
      doc = applyResolvedMediaUrls(doc, {});
    }
  }
  if (syncUserId !== userId) return;

  const applied = doc;
  withDirtySuppressed(() => {
    const store = useBoardLibraryStore.getState();
    // Re-check dirtiness at apply time: the user may have edited this
    // board while its document was downloading.
    const current = Object.values(store.boards).find(
      (b) => b.remoteToken === token,
    );
    if (current?.needsSync) {
      dirtyBoardIds.add(current.id);
      return;
    }

    const boardId = store.upsertRemoteBoard({
      token,
      name: applied.board.name || name,
      ownerId: userId,
      itemOrder: applied.board.itemOrder,
      items: applied.board.items,
      sections: applied.board.sections,
    });
    setCanvasForBoard(boardId, applied.canvas);
    if (boardId === store.activeBoardId) {
      applyCanvasDocument(applied.canvas);
    }
  });
}

// Non-empty boards without a server row (and not owned by someone else)
// become part of this account's push backlog after hydration.
function seedUnsyncedLocalBoards(userId: string): void {
  const { boards } = useBoardLibraryStore.getState();
  for (const board of Object.values(boards)) {
    if (board.remoteToken) continue;
    if (board.ownerId && board.ownerId !== userId) continue;
    const canvas = getCanvasForBoard(board.id);
    const hasContent =
      board.itemOrder.length > 0 ||
      board.sections.length > 0 ||
      board.name !== DEFAULT_BOARD_NAME ||
      (canvas?.rootOrder.length ?? 0) > 0;
    if (hasContent) dirtyBoardIds.add(board.id);
  }
}

// ---------- delete tombstones ----------

function readTombstones(): Set<string> {
  try {
    const raw = localStorage.getItem(TOMBSTONE_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeTombstones(tokens: Set<string>): void {
  try {
    localStorage.setItem(
      TOMBSTONE_STORAGE_KEY,
      JSON.stringify(Array.from(tokens)),
    );
  } catch (error) {
    console.error("[Moodboard] tombstone persist failed:", error);
  }
}

function addTombstone(token: string): void {
  const tokens = readTombstones();
  tokens.add(token);
  writeTombstones(tokens);
}

function removeTombstone(token: string): void {
  const tokens = readTombstones();
  if (!tokens.delete(token)) return;
  writeTombstones(tokens);
}

async function retryTombstonedDeletes(
  persistence: MoodboardPersistenceAdapter,
): Promise<void> {
  if (!persistence.deleteBoard) return;
  for (const token of readTombstones()) {
    try {
      const deleted = await persistence.deleteBoard(token);
      if (deleted) removeTombstone(token);
    } catch (error) {
      console.error("[Moodboard] tombstoned delete retry failed:", error);
    }
  }
}

// ---------- page lifecycle ----------

function restoreLiveCanvasOnce(): void {
  if (restoredLiveCanvas) return;
  restoredLiveCanvas = true;
  restoreLiveCanvasForBoard(useBoardLibraryStore.getState().activeBoardId);
}

function hookPageHide(): void {
  if (pageHideHooked || typeof window === "undefined") return;
  pageHideHooked = true;
  window.addEventListener("pagehide", () => {
    // Durability on exit is local-first: flush the canvas replica and the
    // needsSync flags synchronously (multipart uploads can't be relied on
    // during unload); the next session pushes the backlog.
    const activeId = useBoardLibraryStore.getState().activeBoardId;
    if (activeId && dirtyBoardIds.has(activeId)) stashLiveCanvas(activeId);
    withDirtySuppressed(() => {
      const store = useBoardLibraryStore.getState();
      dirtyBoardIds.forEach((id) => store.markBoardNeedsSync(id));
    });
    persistCanvasReplicaNow();
  });
}

// ---------- small utils ----------

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        await run(items[index]);
      }
    },
  );
  await Promise.all(workers);
}
