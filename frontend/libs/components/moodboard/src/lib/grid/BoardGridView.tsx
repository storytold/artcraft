import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useBoardLibraryStore } from "../boards/BoardLibraryStore";
import {
  collectTags,
  filterItems,
  useActiveBoard,
} from "../boards/boardSelectors";
import toast from "react-hot-toast";
import { useBoardItemEntry } from "../boards/useBoardItemEntry";
import { measureImage } from "../boards/measureMedia";
import { useGalleryBoardDrop } from "./useGalleryBoardDrop";
import { BoardImageItem, BoardItem } from "../boards/boardTypes";
import type { MoodboardAdapter } from "../adapter";
import { BoardGrid } from "./BoardGrid";
import { BoardGridToolbar } from "./BoardGridToolbar";
import { BoardEmptyState } from "./BoardEmptyState";
import { SelectionBar } from "./SelectionBar";
import { ItemInspector } from "./ItemInspector";

interface Props {
  active: boolean;
  adapter: MoodboardAdapter;
}

// Grid mode — the default moodboard view. Owns add-flows, filtering, selection,
// and OS file drop; delegates layout/virtualization to <BoardGrid>. Platform
// seams (upload, library picker, "use as reference") arrive via the adapter.
export const BoardGridView = ({ active, adapter }: Props) => {
  const ensureActiveBoard = useBoardLibraryStore((s) => s.ensureActiveBoard);
  const board = useActiveBoard();
  const { density, searchQuery, activeTagFilters, ratingFilter } =
    useBoardLibraryStore(
      useShallow((s) => ({
        density: s.density,
        searchQuery: s.searchQuery,
        activeTagFilters: s.activeTagFilters,
        ratingFilter: s.ratingFilter,
      })),
    );
  const selectedItemIds = useBoardLibraryStore((s) => s.selectedItemIds);
  const setDensity = useBoardLibraryStore((s) => s.setDensity);
  const setSearchQuery = useBoardLibraryStore((s) => s.setSearchQuery);
  const toggleTagFilter = useBoardLibraryStore((s) => s.toggleTagFilter);
  const setRatingFilter = useBoardLibraryStore((s) => s.setRatingFilter);
  const rateItems = useBoardLibraryStore((s) => s.rateItems);
  const setSelection = useBoardLibraryStore((s) => s.setSelection);
  const toggleSelection = useBoardLibraryStore((s) => s.toggleSelection);
  const clearSelection = useBoardLibraryStore((s) => s.clearSelection);
  const deleteSelected = useBoardLibraryStore((s) => s.deleteSelected);
  const removeItems = useBoardLibraryStore((s) => s.removeItems);
  const updateItem = useBoardLibraryStore((s) => s.updateItem);
  const addColorItem = useBoardLibraryStore((s) => s.addColorItem);
  const renameBoard = useBoardLibraryStore((s) => s.renameBoard);
  const createSection = useBoardLibraryStore((s) => s.createSection);
  const renameSection = useBoardLibraryStore((s) => s.renameSection);
  const deleteSection = useBoardLibraryStore((s) => s.deleteSection);
  const toggleSectionCollapsed = useBoardLibraryStore(
    (s) => s.toggleSectionCollapsed,
  );
  const assignItemsToSection = useBoardLibraryStore(
    (s) => s.assignItemsToSection,
  );

  const { triggerUpload, triggerGallery, addNote, modals } =
    useBoardItemEntry(adapter, active);

  const [dragOver, setDragOver] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  // Which text card is in inline-edit mode (e.g. a freshly-added note).
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const handleAddNote = useCallback(
    () => setEditingTextId(addNote()),
    [addNote],
  );
  const commitText = useCallback(
    (id: string, text: string) => {
      if (board) updateItem(board.id, id, { text });
      setEditingTextId((cur) => (cur === id ? null : cur));
    },
    [board, updateItem],
  );

  useEffect(() => {
    if (active) ensureActiveBoard();
  }, [active, ensureActiveBoard]);

  // Accept gallery items dragged onto the grid (mirrors the canvas listener).
  useGalleryBoardDrop(active);

  const filtered = useMemo(
    () =>
      board
        ? filterItems(board, searchQuery, activeTagFilters, ratingFilter)
        : [],
    [board, searchQuery, activeTagFilters, ratingFilter],
  );
  const tags = useMemo(() => (board ? collectTags(board) : []), [board]);

  const openIndex = openId
    ? filtered.findIndex((it) => it.id === openId)
    : -1;
  const openItem = openIndex >= 0 ? filtered[openIndex] : null;

  const sendReference = (items: BoardItem[]) => {
    const refs = items
      .filter(
        (it): it is BoardImageItem => it.kind === "image" && Boolean(it.mediaId),
      )
      .map((it) => ({ id: it.id, url: it.src, mediaToken: it.mediaId as string }));
    if (refs.length === 0) {
      toast.error("Add images with a media reference to use them in a generation");
      return;
    }
    adapter.sendToGeneration(refs);
  };
  const referenceById = (id: string) => {
    const it = board?.items[id];
    if (it) sendReference([it]);
  };
  const referenceSelected = () => {
    if (!board) return;
    sendReference(
      Array.from(selectedItemIds)
        .map((id) => board.items[id])
        .filter((it): it is BoardItem => Boolean(it)),
    );
  };
  // "Use as reference" only applies to reference-capable items (images with a
  // media token) — never notes/colors/links. Mirrors sendReference's filter.
  const canUseReference = useMemo(
    () =>
      board
        ? Array.from(selectedItemIds).some((id) => {
            const it = board.items[id];
            return it?.kind === "image" && Boolean(it.mediaId);
          })
        : false,
    [board, selectedItemIds],
  );

  const handleNewSection = () => {
    if (board) createSection(board.id);
  };
  const handleAssignToSection = (sectionId: string | null) => {
    if (board) assignItemsToSection(board.id, Array.from(selectedItemIds), sectionId);
  };
  const handleGroupSelectionIntoNewSection = () => {
    if (!board) return;
    const sectionId = createSection(board.id);
    assignItemsToSection(board.id, Array.from(selectedItemIds), sectionId);
  };

  // Grid keyboard: delete / escape + Lightroom-style triage (0-5 rate, P pick)
  // on the current selection. Inert while the inspector owns input. Delete is
  // bound to Delete/Backspace only — `x` is deliberately NOT an alias, since the
  // board has no undo and `x` sits among the number-key triage row, where an
  // accidental press would silently destroy work.
  useEffect(() => {
    if (!active || openId) return undefined;
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (/input|textarea/i.test(t.tagName) || t.isContentEditable)) return;
      const ids = Array.from(selectedItemIds);

      if (e.key === "Escape") {
        clearSelection();
        return;
      }
      if (ids.length === 0) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "p") {
        e.preventDefault();
        if (board) rateItems(board.id, ids, 5);
      } else if (/^[0-5]$/.test(e.key)) {
        e.preventDefault();
        if (board) rateItems(board.id, ids, Number(e.key));
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    active,
    openId,
    board,
    selectedItemIds,
    deleteSelected,
    clearSelection,
    rateItems,
  ]);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;
    const store = useBoardLibraryStore.getState();
    const boardId = store.ensureActiveBoard();
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const dims = await measureImage(url);
      store.addImageItem(boardId, {
        src: url,
        mediaId: null,
        naturalW: dims.w,
        naturalH: dims.h,
      });
    }
  };

  const isEmpty = filtered.length === 0;
  const noItemsAtAll = !board || board.itemOrder.length === 0;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      // Matches MoodboardWorkspace: desktop themes drive --st-bg, the webapp
      // falls back to its --background token (#171717). overflow-hidden keeps
      // the view root from ever scrolling — the grid scrolls internally.
      style={{ background: "var(--st-bg, hsl(0 0% 9%))" }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={handleDrop}
    >
      <BoardGridToolbar
        boardName={board?.name ?? "Moodboard"}
        onRenameBoard={(name) => renameBoard(ensureActiveBoard(), name)}
        itemCount={board?.itemOrder.length ?? 0}
        density={density}
        onDensityChange={setDensity}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        tags={tags}
        activeTags={activeTagFilters}
        onToggleTag={toggleTagFilter}
        ratingFilter={ratingFilter}
        onCycleRatingFilter={() =>
          setRatingFilter(ratingFilter >= 5 ? 0 : ratingFilter + 1)
        }
        onUpload={triggerUpload}
        onLibrary={triggerGallery}
        canPickLibrary={Boolean(adapter.renderLibraryPicker)}
        onAddNote={handleAddNote}
        onAddColor={(color) => addColorItem(ensureActiveBoard(), color)}
        onNewSection={handleNewSection}
      />

      <div className="h-full w-full pt-[68px]">
        {isEmpty ? (
          noItemsAtAll ? (
            <BoardEmptyState
              onUpload={triggerUpload}
              onLibrary={triggerGallery}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-base-fg/45">
              No items match your search.
            </div>
          )
        ) : (
          <BoardGrid
            items={filtered}
            density={density}
            selectedIds={selectedItemIds}
            onSelect={toggleSelection}
            onSelectMany={(ids, additive) => {
              if (additive) {
                const next = new Set(selectedItemIds);
                ids.forEach((id) => next.add(id));
                setSelection(next);
              } else {
                setSelection(ids);
              }
            }}
            onClearSelection={clearSelection}
            onOpen={(id) => setOpenId(id)}
            onUseReference={referenceById}
            onDelete={(id) => board && removeItems(board.id, [id])}
            editingTextId={editingTextId}
            onEditText={setEditingTextId}
            onCommitText={commitText}
            sections={board?.sections}
            onRenameSection={(id, name) =>
              board && renameSection(board.id, id, name)
            }
            onDeleteSection={(id) => board && deleteSection(board.id, id)}
            onToggleSectionCollapsed={(id) =>
              board && toggleSectionCollapsed(board.id, id)
            }
          />
        )}
      </div>

      {dragOver && (
        <div className="pointer-events-none absolute inset-3 z-40 rounded-2xl border-2 border-dashed border-primary/70 bg-primary/5" />
      )}

      <SelectionBar
        count={selectedItemIds.size}
        canUseReference={canUseReference}
        sections={board?.sections ?? []}
        onUseReference={referenceSelected}
        onAssignToSection={handleAssignToSection}
        onCreateSectionWithSelection={handleGroupSelectionIntoNewSection}
        onDelete={deleteSelected}
        onClear={clearSelection}
      />

      {openItem && board && (
        <ItemInspector
          item={openItem}
          hasPrev={openIndex > 0}
          hasNext={openIndex < filtered.length - 1}
          onPrev={() => setOpenId(filtered[openIndex - 1]?.id ?? null)}
          onNext={() => setOpenId(filtered[openIndex + 1]?.id ?? null)}
          onClose={() => setOpenId(null)}
          onAddTag={(tag) => {
            if (openItem.tags.includes(tag)) return;
            updateItem(board.id, openItem.id, {
              tags: [...openItem.tags, tag],
            });
          }}
          onRemoveTag={(tag) =>
            updateItem(board.id, openItem.id, {
              tags: openItem.tags.filter((t) => t !== tag),
            })
          }
          onSetRating={(rating) => rateItems(board.id, [openItem.id], rating)}
          onUseReference={() => sendReference([openItem])}
          onAddPaletteToBoard={(colors) =>
            colors.forEach((c) => addColorItem(board.id, c))
          }
          onDelete={() => {
            removeItems(board.id, [openItem.id]);
            setOpenId(null);
          }}
        />
      )}

      {modals}
    </div>
  );
};
