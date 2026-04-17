import { useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faUpload,
  faPhotoFilm,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";
import { useMoodboardStore, type Board } from "./MoodboardStore";

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onAdd: () => void;
}

const EmptyState = ({ onAdd }: EmptyStateProps) => (
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

interface MainPreviewProps {
  board: Board | null;
  onUploadClick: () => void;
}

const MainPreview = ({ board, onUploadClick }: MainPreviewProps) => (
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

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;

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

  const handleUpdate = useCallback(
    (patch: Partial<Omit<Board, "id" | "shotNumber">>) => {
      if (selectedBoardId) updateBoard(selectedBoardId, patch);
    },
    [selectedBoardId, updateBoard],
  );

  const handleDelete = useCallback(() => {
    if (selectedBoardId) deleteBoard(selectedBoardId);
  }, [selectedBoardId, deleteBoard]);

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
    </div>
  );
};
