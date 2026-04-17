import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faUpload,
  faPhotoFilm,
  faPlay,
  faPause,
  faBackwardStep,
  faForwardStep,
  faBackwardFast,
  faForwardFast,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";
import { useMoodboardStore, type Board } from "./MoodboardStore";

const PIXELS_PER_SECOND = 80;
const MIN_BLOCK_WIDTH = 40;
const MIN_DURATION = 0.5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface BoardTiming {
  board: Board;
  startTime: number;
}

const buildBoardTimings = (boards: Board[]): BoardTiming[] => {
  let t = 0;
  return boards.map((board) => {
    const startTime = t;
    t += board.duration;
    return { board, startTime };
  });
};

const formatTime = (s: number): string => {
  const clamped = Math.max(0, s);
  const mins = Math.floor(clamped / 60);
  const secs = (clamped % 60).toFixed(1);
  return mins > 0 ? `${mins}:${secs.padStart(4, "0")}` : `${secs}s`;
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex h-[calc(100vh-56px)] w-full items-center justify-center bg-ui-background">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
        <FontAwesomeIcon icon={faPhotoFilm} className="text-4xl text-base-fg/40" />
      </div>
      <div>
        <p className="text-lg font-semibold text-base-fg">No shots yet</p>
        <p className="mt-1 text-sm text-base-fg/50">Add your first shot to get started</p>
      </div>
      <Button variant="primary" icon={faPlus} onClick={onAdd}>
        Add your first shot
      </Button>
    </div>
  </div>
);

// ─── MetadataEditor ───────────────────────────────────────────────────────────

interface MetadataEditorProps {
  board: Board;
  onUpdate: (patch: Partial<Omit<Board, "id" | "shotNumber">>) => void;
  onDelete: () => void;
  onUpload: () => void;
}

const MetadataEditor = ({ board, onUpdate, onDelete, onUpload }: MetadataEditorProps) => (
  <aside className="flex w-[280px] shrink-0 flex-col border-r border-ui-panel-border bg-ui-panel">
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-3">
        <div className="text-xs font-medium uppercase tracking-wider text-base-fg/40">
          Shot {board.shotNumber}
        </div>

        <div>
          <label className="mb-1 block text-xs text-base-fg/60">Title</label>
          <input
            type="text"
            value={board.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Shot title"
            className="w-full rounded-md border border-ui-panel-border bg-ui-background px-3 py-2 text-sm text-base-fg placeholder:text-base-fg/30 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-base-fg/60">Dialogue</label>
          <textarea
            value={board.dialogue}
            onChange={(e) => onUpdate({ dialogue: e.target.value })}
            placeholder="Character dialogue..."
            rows={3}
            className="w-full resize-none rounded-md border border-ui-panel-border bg-ui-background px-3 py-2 text-sm text-base-fg placeholder:text-base-fg/30 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-base-fg/60">Action</label>
          <textarea
            value={board.action}
            onChange={(e) => onUpdate({ action: e.target.value })}
            placeholder="On-screen action..."
            rows={3}
            className="w-full resize-none rounded-md border border-ui-panel-border bg-ui-background px-3 py-2 text-sm text-base-fg placeholder:text-base-fg/30 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-base-fg/60">Notes</label>
          <textarea
            value={board.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Director notes..."
            rows={3}
            className="w-full resize-none rounded-md border border-ui-panel-border bg-ui-background px-3 py-2 text-sm text-base-fg placeholder:text-base-fg/30 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-base-fg/60">Duration (seconds)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={board.duration}
            onChange={(e) => onUpdate({ duration: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-ui-panel-border bg-ui-background px-3 py-2 text-sm text-base-fg focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-2 border-t border-ui-panel-border p-4">
      <Button variant="action" icon={faUpload} onClick={onUpload} className="w-full justify-center">
        Upload Image
      </Button>
      <Button
        variant="action"
        icon={faTrash}
        onClick={onDelete}
        className="w-full justify-center text-red-400 hover:text-red-300"
      >
        Delete Shot
      </Button>
    </div>
  </aside>
);

// ─── MainPreview ──────────────────────────────────────────────────────────────

const MainPreview = ({
  board,
  onUploadClick,
}: {
  board: Board | null;
  onUploadClick: () => void;
}) => (
  <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-ui-background">
    {board === null ? (
      <p className="text-sm text-base-fg/30">Select a shot</p>
    ) : board.imageDataUrl ? (
      <>
        <img
          src={board.imageDataUrl}
          alt={board.title || `Shot ${board.shotNumber}`}
          className="max-h-full max-w-full object-contain"
          style={{ pointerEvents: "none" }}
        />
        {board.title && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-4 py-2 backdrop-blur-sm">
            <p className="text-sm font-medium text-white">{board.title}</p>
          </div>
        )}
      </>
    ) : (
      <button
        onClick={onUploadClick}
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ui-panel-border p-12 text-base-fg/40 transition-colors hover:border-primary/50 hover:text-base-fg/70"
      >
        <FontAwesomeIcon icon={faUpload} className="text-3xl" />
        <span className="text-sm">Click to upload an image</span>
      </button>
    )}
  </div>
);

// ─── ThumbnailItem ────────────────────────────────────────────────────────────

interface ThumbnailItemProps {
  board: Board;
  index: number;
  isSelected: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

const ThumbnailItem = ({
  board,
  index,
  isSelected,
  isDragOver,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ThumbnailItemProps) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, index)}
    onDragOver={(e) => {
      e.preventDefault();
      onDragOver(e, index);
    }}
    onDrop={(e) => onDrop(e, index)}
    onDragEnd={onDragEnd}
    onClick={onSelect}
    className={twMerge(
      "relative flex h-[60px] w-[100px] shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all select-none",
      isSelected
        ? "border-primary ring-2 ring-primary/30"
        : "border-transparent hover:border-white/20",
      isDragOver && "border-primary/60 opacity-60",
    )}
  >
    {board.imageDataUrl ? (
      <img src={board.imageDataUrl} alt="" className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-white/5">
        <FontAwesomeIcon icon={faPhotoFilm} className="text-lg text-base-fg/20" />
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
      <span className="text-[10px] text-white/70">{board.shotNumber}</span>
    </div>
  </div>
);

// ─── Filmstrip ────────────────────────────────────────────────────────────────

interface FilmstripProps {
  boards: Board[];
  selectedBoardId: string | null;
  dragOverIndex: number | null;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

const Filmstrip = ({
  boards,
  selectedBoardId,
  dragOverIndex,
  onAdd,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: FilmstripProps) => (
  <div className="flex h-[80px] shrink-0 items-center gap-2 overflow-x-auto border-t border-ui-panel-border bg-ui-panel px-3">
    <button
      onClick={onAdd}
      className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-md border-2 border-dashed border-ui-panel-border bg-transparent text-base-fg/40 transition-colors hover:border-primary/50 hover:text-primary"
      title="Add shot"
    >
      <FontAwesomeIcon icon={faPlus} />
    </button>

    {boards.map((board, index) => (
      <ThumbnailItem
        key={board.id}
        board={board}
        index={index}
        isSelected={board.id === selectedBoardId}
        isDragOver={dragOverIndex === index}
        onSelect={() => onSelect(board.id)}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />
    ))}
  </div>
);

// ─── Timeline ─────────────────────────────────────────────────────────────────

interface TimelineDragState {
  boardId: string;
  boardIndex: number;
  caretX: number;
  insertionIndex: number;
}

interface TimelineProps {
  boards: Board[];
  selectedBoardId: string | null;
  currentTimeSeconds: number;
  onSelectBoard: (id: string, startTime: number) => void;
  onUpdateDuration: (id: string, duration: number) => void;
  onSeek: (time: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const Timeline = ({
  boards,
  selectedBoardId,
  currentTimeSeconds,
  onSelectBoard,
  onUpdateDuration,
  onSeek,
  onReorder,
}: TimelineProps) => {
  const laneRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ id: string; startX: number; startDuration: number } | null>(null);
  const dragRef = useRef<{ boardId: string; boardIndex: number } | null>(null);
  const [dragState, setDragState] = useState<TimelineDragState | null>(null);

  const boardTimings: BoardTiming[] = useMemo(() => buildBoardTimings(boards), [boards]);
  const totalDuration = boardTimings.reduce((s, { board }) => s + board.duration, 0);
  const totalWidth = Math.max(totalDuration * PIXELS_PER_SECOND, 300);

  // ── Resize handlers ──────────────────────────────────────────────────────

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, id: string, currentDuration: number) => {
      e.stopPropagation();
      e.preventDefault();
      resizeRef.current = { id, startX: e.clientX, startDuration: currentDuration };

      const onMove = (ev: PointerEvent) => {
        if (!resizeRef.current) return;
        const delta = ev.clientX - resizeRef.current.startX;
        const newDuration = Math.max(
          MIN_DURATION,
          parseFloat((resizeRef.current.startDuration + delta / PIXELS_PER_SECOND).toFixed(1)),
        );
        onUpdateDuration(resizeRef.current.id, newDuration);
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [onUpdateDuration],
  );

  // ── Drag-to-rearrange handlers ───────────────────────────────────────────

  const computeInsertionFromPointerX = useCallback(
    (pointerX: number, fromIndex: number): { caretX: number; insertionIndex: number } => {
      let insertionIndex = boardTimings.length;
      let caretX = totalWidth;

      for (let i = 0; i < boardTimings.length; i++) {
        if (i === fromIndex) continue;
        const { startTime, board } = boardTimings[i];
        const midX = (startTime + board.duration / 2) * PIXELS_PER_SECOND;
        if (pointerX < midX) {
          insertionIndex = i;
          caretX = startTime * PIXELS_PER_SECOND;
          break;
        } else {
          insertionIndex = i + 1;
          caretX = (startTime + board.duration) * PIXELS_PER_SECOND;
        }
      }

      return { caretX, insertionIndex };
    },
    [boardTimings, totalWidth],
  );

  const handleBoardPointerDown = useCallback(
    (e: React.PointerEvent, boardId: string, boardIndex: number) => {
      // Don't initiate drag if clicking the resize handle
      if ((e.target as HTMLElement).dataset.resize) return;
      e.stopPropagation();
      e.preventDefault();

      dragRef.current = { boardId, boardIndex };

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current || !laneRef.current) return;
        const rect = laneRef.current.getBoundingClientRect();
        const scrollLeft = laneRef.current.scrollLeft;
        const pointerX = ev.clientX - rect.left + scrollLeft;
        const { caretX, insertionIndex } = computeInsertionFromPointerX(
          pointerX,
          dragRef.current.boardIndex,
        );
        setDragState({
          boardId: dragRef.current.boardId,
          boardIndex: dragRef.current.boardIndex,
          caretX,
          insertionIndex,
        });
      };

      const onUp = () => {
        if (dragRef.current) {
          setDragState((prev) => {
            if (!prev || !dragRef.current) return null;
            const { boardIndex, insertionIndex } = prev;
            // Adjust toIndex: if moving forward, subtract 1 because the item is removed first
            const toIndex =
              insertionIndex > boardIndex ? insertionIndex - 1 : insertionIndex;
            if (toIndex !== boardIndex) {
              onReorder(boardIndex, toIndex);
            }
            return null;
          });
          dragRef.current = null;
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [computeInsertionFromPointerX, onReorder],
  );

  // ── Seek by clicking empty lane area ─────────────────────────────────────

  const handleLanePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!laneRef.current) return;
      const rect = laneRef.current.getBoundingClientRect();
      const scrollLeft = laneRef.current.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft;
      const time = Math.min(Math.max(0, x / PIXELS_PER_SECOND), totalDuration);
      onSeek(time);

      const hit = boardTimings.find(
        ({ board, startTime }) =>
          x >= startTime * PIXELS_PER_SECOND &&
          x < (startTime + board.duration) * PIXELS_PER_SECOND,
      );
      if (hit) onSelectBoard(hit.board.id, hit.startTime);
    },
    [boardTimings, totalDuration, onSeek, onSelectBoard],
  );

  const playheadLeft = currentTimeSeconds * PIXELS_PER_SECOND;

  return (
    <div className="shrink-0 border-t border-ui-panel-border bg-[#1a1a1a]">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-ui-panel-border/40 px-3 py-1">
        <span className="font-mono text-xs text-base-fg/50">{formatTime(currentTimeSeconds)}</span>
        <span className="text-xs text-base-fg/25">Timeline</span>
        <span className="font-mono text-xs text-base-fg/50">{formatTime(totalDuration)}</span>
      </div>

      {/* Lane */}
      <div
        ref={laneRef}
        className="relative h-[90px] overflow-x-auto overflow-y-hidden"
        style={{ cursor: dragState ? "grabbing" : "crosshair" }}
        onPointerDown={handleLanePointerDown}
      >
        <div className="relative h-full" style={{ width: totalWidth + 40 }}>
          {/* Ruler ticks */}
          {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
            <div
              key={i}
              className="pointer-events-none absolute top-0 flex flex-col items-center"
              style={{ left: i * PIXELS_PER_SECOND }}
            >
              <div className="h-2 w-px bg-white/10" />
              <span className="text-[9px] text-base-fg/25">{i}s</span>
            </div>
          ))}

          {/* Board blocks */}
          {boardTimings.map(({ board, startTime }, idx) => {
            const blockWidth = Math.max(MIN_BLOCK_WIDTH, board.duration * PIXELS_PER_SECOND);
            const isSelected = board.id === selectedBoardId;
            const isDragging = dragState?.boardId === board.id;

            return (
              <div
                key={board.id}
                className={twMerge(
                  "absolute top-6 bottom-1 flex items-stretch overflow-hidden rounded border transition-colors",
                  isSelected
                    ? "border-primary bg-primary/25"
                    : "border-white/15 bg-white/5 hover:bg-white/10",
                )}
                style={{
                  left: startTime * PIXELS_PER_SECOND + 1,
                  width: blockWidth - 2,
                  opacity: isDragging ? 0.5 : 1,
                  filter: isDragging ? "saturate(1.4)" : undefined,
                  cursor: "grab",
                  userSelect: "none",
                }}
                onPointerDown={(e) => handleBoardPointerDown(e, board.id, idx)}
              >
                {board.imageDataUrl && (
                  <img
                    src={board.imageDataUrl}
                    className="h-full w-8 shrink-0 object-cover opacity-50"
                    alt=""
                    style={{ pointerEvents: "none" }}
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-1.5">
                  <span className="truncate text-[10px] font-semibold text-base-fg/80">
                    {board.shotNumber}
                    {board.title ? ` · ${board.title}` : ""}
                  </span>
                  {board.dialogue && (
                    <span className="truncate text-[9px] italic text-base-fg/40">
                      "{board.dialogue}"
                    </span>
                  )}
                  <span className="text-[9px] text-base-fg/30">{board.duration.toFixed(1)}s</span>
                </div>

                {/* Resize handle */}
                <div
                  data-resize="true"
                  className="absolute right-0 top-0 bottom-0 w-2 rounded-r opacity-0 transition-opacity hover:bg-white/30 hover:opacity-100"
                  style={{ cursor: "ew-resize" }}
                  onPointerDown={(e) => handleResizePointerDown(e, board.id, board.duration)}
                  title="Drag to resize duration"
                />
              </div>
            );
          })}

          {/* Drag insertion caret */}
          {dragState && (
            <div
              className="pointer-events-none absolute top-5 bottom-0 z-30 w-0.5 bg-yellow-400"
              style={{ left: dragState.caretX }}
            >
              {/* Downward-pointing triangle at top */}
              <div className="absolute -left-[5px] -top-[6px] h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-yellow-400" />
            </div>
          )}

          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-primary"
            style={{ left: playheadLeft }}
          >
            <div className="absolute -left-[4px] top-0 h-0 w-0 border-x-[4px] border-t-[7px] border-x-transparent border-t-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PlaybackControls ─────────────────────────────────────────────────────────

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTimeSeconds: number;
  totalDuration: number;
  currentBoardNumber: number | null;
  totalBoards: number;
  onPlay: () => void;
  onPause: () => void;
  onPrevBoard: () => void;
  onNextBoard: () => void;
  onPrevScene: () => void;
  onNextScene: () => void;
}

const PlaybackControls = ({
  isPlaying,
  currentTimeSeconds,
  totalDuration,
  currentBoardNumber,
  totalBoards,
  onPlay,
  onPause,
  onPrevBoard,
  onNextBoard,
  onPrevScene,
  onNextScene,
}: PlaybackControlsProps) => {
  const transportBtnClass =
    "flex h-9 w-9 items-center justify-center rounded-md text-base-fg/70 transition-colors hover:bg-white/10 hover:text-base-fg active:scale-95";

  return (
    <div className="flex h-[52px] shrink-0 items-center border-t border-ui-panel-border bg-[#111] px-4">
      {/* Left stats */}
      <div className="flex w-32 flex-col">
        <span className="font-mono text-xs text-base-fg/60">{formatTime(currentTimeSeconds)}</span>
        <span className="text-[10px] text-base-fg/30">
          {currentBoardNumber !== null ? `Shot ${currentBoardNumber}` : "—"}
        </span>
      </div>

      {/* Transport buttons — centered */}
      <div className="flex flex-1 items-center justify-center gap-1">
        <button
          className={transportBtnClass}
          onClick={onPrevScene}
          title="Go to start (Ctrl+←)"
        >
          <FontAwesomeIcon icon={faBackwardFast} />
        </button>
        <button
          className={transportBtnClass}
          onClick={onPrevBoard}
          title="Previous shot (←)"
        >
          <FontAwesomeIcon icon={faBackwardStep} />
        </button>

        {/* Play / Pause */}
        <button
          className="mx-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-primary-400 active:scale-95"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? "Pause" : "Play"}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-sm" />
        </button>

        <button
          className={transportBtnClass}
          onClick={onNextBoard}
          title="Next shot (→)"
        >
          <FontAwesomeIcon icon={faForwardStep} />
        </button>
        <button
          className={transportBtnClass}
          onClick={onNextScene}
          title="Go to end (Ctrl+→)"
        >
          <FontAwesomeIcon icon={faForwardFast} />
        </button>
      </div>

      {/* Right stats */}
      <div className="flex w-32 flex-col items-end">
        <span className="font-mono text-xs text-base-fg/60">{formatTime(totalDuration)}</span>
        <span className="text-[10px] text-base-fg/30">{totalBoards} shot{totalBoards !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
};

// ─── Moodboard ────────────────────────────────────────────────────────────────

export const Moodboard = () => {
  const boards = useMoodboardStore((s) => s.boards);
  const selectedBoardId = useMoodboardStore((s) => s.selectedBoardId);
  const addBoard = useMoodboardStore((s) => s.addBoard);
  const deleteBoard = useMoodboardStore((s) => s.deleteBoard);
  const selectBoard = useMoodboardStore((s) => s.selectBoard);
  const updateBoard = useMoodboardStore((s) => s.updateBoard);
  const reorderBoards = useMoodboardStore((s) => s.reorderBoards);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs for playback rAF loop (avoid stale closures)
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const boardsRef = useRef<Board[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Keep refs in sync with state/props
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentTimeRef.current = currentTimeSeconds; }, [currentTimeSeconds]);
  useEffect(() => { boardsRef.current = boards; }, [boards]);

  const boardTimings = useMemo(() => buildBoardTimings(boards), [boards]);
  const totalDuration = boardTimings.reduce((s, { board }) => s + board.duration, 0);
  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;

  // ── Playback engine ────────────────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimestampRef.current = null;
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      const last = lastTimestampRef.current;
      if (last !== null) {
        const delta = (timestamp - last) / 1000;
        const nextTime = currentTimeRef.current + delta;
        const timings = buildBoardTimings(boardsRef.current);
        const dur = timings.reduce((s, { board }) => s + board.duration, 0);

        if (nextTime >= dur) {
          // Reached end — stop
          setCurrentTimeSeconds(dur);
          currentTimeRef.current = dur;
          stopPlayback();
          return;
        }

        setCurrentTimeSeconds(nextTime);
        currentTimeRef.current = nextTime;

        // Auto-select board under playhead
        const hit = timings.find(
          ({ board, startTime }) =>
            nextTime >= startTime && nextTime < startTime + board.duration,
        );
        if (hit && hit.board.id !== selectedBoardId) {
          selectBoard(hit.board.id);
        }
      }
      lastTimestampRef.current = timestamp;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // ── Playback control actions ───────────────────────────────────────────────

  const handlePlay = useCallback(() => {
    // If at the end, restart from beginning
    if (currentTimeRef.current >= totalDuration && totalDuration > 0) {
      setCurrentTimeSeconds(0);
      currentTimeRef.current = 0;
    }
    setIsPlaying(true);
  }, [totalDuration]);

  const handlePause = useCallback(() => stopPlayback(), [stopPlayback]);

  const handlePrevBoard = useCallback(() => {
    const timings = buildBoardTimings(boards);
    const curTime = currentTimeRef.current;
    // If we're more than 0.3s into the current board, rewind to its start
    const currentEntry = timings.find(
      ({ startTime, board }) => curTime >= startTime && curTime < startTime + board.duration,
    );
    if (currentEntry && curTime - currentEntry.startTime > 0.3) {
      setCurrentTimeSeconds(currentEntry.startTime);
      currentTimeRef.current = currentEntry.startTime;
      selectBoard(currentEntry.board.id);
      return;
    }
    // Otherwise go to start of previous board
    const idx = timings.findIndex(({ board }) => board.id === selectedBoardId);
    const prevEntry = idx > 0 ? timings[idx - 1] : timings[0];
    if (prevEntry) {
      setCurrentTimeSeconds(prevEntry.startTime);
      currentTimeRef.current = prevEntry.startTime;
      selectBoard(prevEntry.board.id);
    }
  }, [boards, selectedBoardId, selectBoard]);

  const handleNextBoard = useCallback(() => {
    const timings = buildBoardTimings(boards);
    const idx = timings.findIndex(({ board }) => board.id === selectedBoardId);
    const nextEntry = idx >= 0 && idx < timings.length - 1 ? timings[idx + 1] : null;
    if (nextEntry) {
      setCurrentTimeSeconds(nextEntry.startTime);
      currentTimeRef.current = nextEntry.startTime;
      selectBoard(nextEntry.board.id);
    }
  }, [boards, selectedBoardId, selectBoard]);

  const handlePrevScene = useCallback(() => {
    setCurrentTimeSeconds(0);
    currentTimeRef.current = 0;
    if (boards.length > 0) selectBoard(boards[0].id);
  }, [boards, selectBoard]);

  const handleNextScene = useCallback(() => {
    setCurrentTimeSeconds(totalDuration);
    currentTimeRef.current = totalDuration;
    stopPlayback();
  }, [totalDuration, stopPlayback]);

  // ── File upload ────────────────────────────────────────────────────────────

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedBoardId) return;
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          updateBoard(selectedBoardId, { imageDataUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [selectedBoardId, updateBoard],
  );

  // ── Filmstrip drag handlers ────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((_e: React.DragEvent, index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (_e: React.DragEvent, toIndex: number) => {
      const fromIndex = dragIndexRef.current;
      if (fromIndex !== null && fromIndex !== toIndex) {
        reorderBoards(fromIndex, toIndex);
      }
      setDragOverIndex(null);
      dragIndexRef.current = null;
    },
    [reorderBoards],
  );

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }, []);

  // ── Metadata update / delete ───────────────────────────────────────────────

  const handleUpdate = useCallback(
    (patch: Partial<Omit<Board, "id" | "shotNumber">>) => {
      if (selectedBoardId) updateBoard(selectedBoardId, patch);
    },
    [selectedBoardId, updateBoard],
  );

  const handleDelete = useCallback(() => {
    if (selectedBoardId) deleteBoard(selectedBoardId);
  }, [selectedBoardId, deleteBoard]);

  // ── Timeline callbacks ────────────────────────────────────────────────────

  const handleTimelineSelect = useCallback(
    (id: string, startTime: number) => {
      selectBoard(id);
      setCurrentTimeSeconds(startTime);
      currentTimeRef.current = startTime;
    },
    [selectBoard],
  );

  const handleSeek = useCallback((time: number) => {
    setCurrentTimeSeconds(time);
    currentTimeRef.current = time;
  }, []);

  const handleUpdateDuration = useCallback(
    (id: string, duration: number) => updateBoard(id, { duration }),
    [updateBoard],
  );

  // ── Derived values for PlaybackControls ──────────────────────────────────

  const currentBoardNumber = useMemo(() => {
    const hit = boardTimings.find(
      ({ startTime, board }) =>
        currentTimeSeconds >= startTime &&
        currentTimeSeconds < startTime + board.duration,
    );
    return hit?.board.shotNumber ?? null;
  }, [boardTimings, currentTimeSeconds]);

  if (boards.length === 0) {
    return <EmptyState onAdd={addBoard} />;
  }

  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-ui-background text-base-fg">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top section: metadata panel + main preview */}
      <div className="flex flex-1 overflow-hidden">
        {selectedBoard ? (
          <MetadataEditor
            board={selectedBoard}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onUpload={handleUploadClick}
          />
        ) : (
          <div className="w-[280px] shrink-0 border-r border-ui-panel-border bg-ui-panel" />
        )}
        <MainPreview board={selectedBoard} onUploadClick={handleUploadClick} />
      </div>

      {/* Filmstrip */}
      <Filmstrip
        boards={boards}
        selectedBoardId={selectedBoardId}
        dragOverIndex={dragOverIndex}
        onAdd={addBoard}
        onSelect={selectBoard}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      />

      {/* Timeline */}
      <Timeline
        boards={boards}
        selectedBoardId={selectedBoardId}
        currentTimeSeconds={currentTimeSeconds}
        onSelectBoard={handleTimelineSelect}
        onUpdateDuration={handleUpdateDuration}
        onSeek={handleSeek}
        onReorder={reorderBoards}
      />

      {/* Playback controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        currentTimeSeconds={currentTimeSeconds}
        totalDuration={totalDuration}
        currentBoardNumber={currentBoardNumber}
        totalBoards={boards.length}
        onPlay={handlePlay}
        onPause={handlePause}
        onPrevBoard={handlePrevBoard}
        onNextBoard={handleNextBoard}
        onPrevScene={handlePrevScene}
        onNextScene={handleNextScene}
      />
    </div>
  );
};
