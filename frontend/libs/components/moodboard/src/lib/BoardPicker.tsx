import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useBoardLibraryStore } from "./boards/BoardLibraryStore";
import {
  applyCanvasDocument,
  createBoardAndSwitch,
  getCanvasForBoard,
  switchActiveBoard,
} from "./persistence/canvasBridge";
import { deleteBoardEverywhere } from "./persistence/moodboardSync";

// Board switcher for the workspace's top-left cluster. Lists every board in
// the library (local + hydrated remote), switches the active board (swapping
// the canvas via the bridge), and hosts New/Delete. Rename stays on the grid
// toolbar's inline title.
export const BoardPicker = () => {
  const { boards, boardOrder, activeBoardId } = useBoardLibraryStore(
    useShallow((s) => ({
      boards: s.boards,
      boardOrder: s.boardOrder,
      activeBoardId: s.activeBoardId,
    })),
  );
  const [open, setOpen] = useState(false);
  // Id of the board whose trash button was pressed and is now waiting on "Delete / Cancel", or null when no
  // question is showing. Only one board can be waiting at a time. Read by the board rows below.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeBoard = activeBoardId ? boards[activeBoardId] : null;
  const orderedBoards = boardOrder
    .map((id) => boards[id])
    .filter((b) => Boolean(b));

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Whenever the dropdown closes (outside click, switching boards, New board) forget any pending delete
  // question, so reopening the dropdown later never shows a stale "Delete?" that one click could confirm.
  useEffect(() => {
    if (!open) setPendingDeleteId(null);
  }, [open]);

  const handleSwitch = (boardId: string) => {
    switchActiveBoard(boardId);
    setOpen(false);
  };

  const handleNewBoard = () => {
    createBoardAndSwitch();
    setOpen(false);
  };

  // Trash button pressed: only ASK. Nothing is deleted until the person presses the confirm button that
  // replaces the row. This used to call window.confirm, but in the desktop app the Tauri dialog plugin
  // replaces window.confirm with an async function (tauri-plugin-dialog init-iife.js), so it returns a
  // Promise, which is always truthy: `!window.confirm(...)` was never true and the board was deleted at once.
  const handleAskDelete = (boardId: string) => {
    setPendingDeleteId(boardId);
  };

  // Cancel pressed: put the row back to normal; touches only this component's state.
  const handleCancelDelete = () => {
    setPendingDeleteId(null);
  };

  // Confirm pressed: the real delete. Clears the question first so the row can never be confirmed twice,
  // then deletes locally + remotely (deleteBoardEverywhere) and, if the active board went away, loads the
  // canvas of whichever board the store made active.
  const handleDelete = async (boardId: string) => {
    setPendingDeleteId(null);
    const board = boards[boardId];
    if (!board) return;
    const wasActive = activeBoardId === boardId;
    await deleteBoardEverywhere(boardId);
    if (wasActive) {
      const nextActiveId = useBoardLibraryStore.getState().activeBoardId;
      applyCanvasDocument(
        nextActiveId ? getCanvasForBoard(nextActiveId) : null,
      );
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Switch board"
        aria-label="Switch board"
        className="flex max-w-[180px] items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-medium text-base-fg/70 transition-colors duration-150 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="truncate">{activeBoard?.name ?? "Boards"}</span>
        <ChevronDownIcon  className="h-3 w-3 shrink-0" />
      </button>

      {open && (
        <div className="glass absolute left-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-ui-divider p-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]">
          <div className="max-h-72 overflow-y-auto">
            {orderedBoards.map((board) =>
              // The board waiting on its confirmation shows the question in place of its normal row.
              board.id === pendingDeleteId ? (
                <div
                  key={board.id}
                  className="flex flex-col gap-2 rounded-xl bg-red-500/10 px-3 py-2"
                >
                  <p className="text-sm text-base-fg">
                    {`Delete "${board.name}"? This can't be undone.`}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      aria-label={`Cancel deleting ${board.name}`}
                      onClick={handleCancelDelete}
                      // Cancel has focus first so a stray Enter / Space keeps the board instead of deleting it.
                      autoFocus
                      className="rounded-lg px-3 py-1 text-sm text-base-fg/70 hover:bg-base-fg/10 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      aria-label={`Confirm deleting ${board.name}`}
                      onClick={() => void handleDelete(board.id)}
                      className="rounded-lg bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400 hover:bg-red-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
              <div
                key={board.id}
                className={[
                  "group flex items-center gap-1 rounded-xl",
                  board.id === activeBoardId
                    ? "bg-base-fg/15"
                    : "hover:bg-base-fg/10",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => handleSwitch(board.id)}
                  className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm text-base-fg focus:outline-none"
                >
                  {board.name}
                </button>
                <button
                  type="button"
                  title={`Delete ${board.name}`}
                  aria-label={`Delete ${board.name}`}
                  // Only asks; the confirm button in the row above does the deleting.
                  onClick={() => handleAskDelete(board.id)}
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base-fg/40 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2Icon  className="h-3 w-3" />
                </button>
              </div>
              ),
            )}
          </div>
          <button
            type="button"
            onClick={handleNewBoard}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-fg/70 transition-colors hover:bg-base-fg/10 hover:text-base-fg focus:outline-none"
          >
            <PlusIcon  className="h-3 w-3" />
            New board
          </button>
        </div>
      )}
    </div>
  );
};
