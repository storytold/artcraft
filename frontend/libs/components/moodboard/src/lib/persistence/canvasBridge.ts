import { useMoodboardStore } from "../canvas/MoodboardStore";
import { useMoodboardHistoryStore } from "../canvas/MoodboardHistoryStore";
import { useBoardLibraryStore } from "../boards/BoardLibraryStore";
import { withDirtySuppressed } from "./dirtySuppression";
import {
  EMPTY_CANVAS_DOCUMENT,
  type MoodboardCanvasDocument,
} from "./documents";

// The Konva canvas store is a single global surface with no board concept.
// This bridge keys canvas documents by board id (in memory) so switching
// boards swaps the canvas, and the sync layer can save/restore each board's
// canvas alongside its grid model.

const canvasByBoard = new Map<string, MoodboardCanvasDocument>();

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
  canvasByBoard.set(boardId, document);
}

export function getCanvasForBoard(
  boardId: string,
): MoodboardCanvasDocument | null {
  return canvasByBoard.get(boardId) ?? null;
}

export function dropCanvasForBoard(boardId: string): void {
  canvasByBoard.delete(boardId);
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
    canvasByBoard.set(fromBoardId, captureCanvasDocument());
  }
  applyCanvasDocument(canvasByBoard.get(toBoardId) ?? null);
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
