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

  const handleSwitch = (boardId: string) => {
    switchActiveBoard(boardId);
    setOpen(false);
  };

  const handleNewBoard = () => {
    createBoardAndSwitch();
    setOpen(false);
  };

  const handleDelete = async (boardId: string) => {
    const board = boards[boardId];
    if (!board) return;
    if (!window.confirm(`Delete "${board.name}"? This can't be undone.`)) {
      return;
    }
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
        className="flex max-w-[180px] items-center gap-2 rounded-[3px] px-3.5 py-1.5 text-sm font-medium text-base-fg/70 transition-colors duration-150 hover:bg-white/5 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="truncate">{activeBoard?.name ?? "Boards"}</span>
        <ChevronDownIcon  className="h-3 w-3 shrink-0" />
      </button>

      {open && (
        <div className="glass absolute left-0 top-full z-50 mt-1.5 w-64 border border-ui-divider p-1.5">
          <div className="max-h-72 overflow-y-auto">
            {orderedBoards.map((board) => (
              <div
                key={board.id}
                className={[
                  "group flex items-center gap-1 rounded-[3px]",
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
                  onClick={() => void handleDelete(board.id)}
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] text-base-fg/40 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2Icon  className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleNewBoard}
            className="mt-1 flex w-full items-center gap-2 rounded-[3px] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/70 transition-colors hover:bg-base-fg/10 hover:text-base-fg focus:outline-none"
          >
            <PlusIcon  className="h-3 w-3" />
            New board
          </button>
        </div>
      )}
    </div>
  );
};
