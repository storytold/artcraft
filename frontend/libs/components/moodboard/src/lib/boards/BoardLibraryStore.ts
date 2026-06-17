import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  Board,
  BoardImageItem,
  BoardItem,
  BoardLinkItem,
  BoardVideoItem,
  COLOR_ITEM_ASPECT,
  GridDensity,
  LINK_ITEM_ASPECT,
  TEXT_ITEM_ASPECT,
  ViewMode,
} from "./boardTypes";

const STORAGE_KEY = "artcraft_moodboard_library";
const STORAGE_VERSION = 1;

// Persisted slice of the library (excludes transient UI: selection, search,
// tag filters). All mutations go through the actions below — that indirection
// is the seam a future backend sync layer slots into without touching views.
interface PersistedLibrary {
  boards: Record<string, Board>;
  boardOrder: string[];
  activeBoardId: string | null;
  viewMode: ViewMode;
  density: GridDensity;
}

interface BoardLibraryState extends PersistedLibrary {
  // Transient (not persisted)
  searchQuery: string;
  activeTagFilters: string[];
  ratingFilter: number;
  selectedItemIds: Set<string>;

  // Board lifecycle
  ensureActiveBoard: () => string;
  createBoard: (name?: string) => string;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  setActiveBoard: (id: string) => void;

  // Item entry — typed creators that fill base fields + aspect.
  addImageItem: (
    boardId: string,
    data: Pick<BoardImageItem, "src" | "mediaId" | "naturalW" | "naturalH"> &
      Partial<Pick<BoardImageItem, "caption">>,
  ) => string;
  addVideoItem: (
    boardId: string,
    data: Pick<BoardVideoItem, "src" | "mediaId" | "naturalW" | "naturalH">,
  ) => string;
  addTextItem: (boardId: string, text: string) => string;
  addLinkItem: (
    boardId: string,
    data: Pick<BoardLinkItem, "url" | "title" | "description" | "image">,
  ) => string;
  addColorItem: (boardId: string, color: string) => string;

  updateItem: (boardId: string, id: string, patch: Partial<BoardItem>) => void;
  removeItems: (boardId: string, ids: string[]) => void;
  // Triage: set the same rating (0-5) on many items in one history step.
  rateItems: (boardId: string, ids: string[], rating: number) => void;

  // Sections — organize items into named lanes within a board.
  createSection: (boardId: string, name?: string) => string;
  renameSection: (boardId: string, sectionId: string, name: string) => void;
  deleteSection: (boardId: string, sectionId: string) => void;
  toggleSectionCollapsed: (boardId: string, sectionId: string) => void;
  // Move items into a section (or back to the ungrouped flow with null).
  assignItemsToSection: (
    boardId: string,
    ids: string[],
    sectionId: string | null,
  ) => void;

  // View + filters
  setViewMode: (mode: ViewMode) => void;
  setDensity: (density: GridDensity) => void;
  setSearchQuery: (q: string) => void;
  toggleTagFilter: (tag: string) => void;
  setRatingFilter: (min: number) => void;
  clearFilters: () => void;

  // Selection (operates on the active board)
  setSelection: (ids: Iterable<string>) => void;
  // Clicks accumulate; `additive` is accepted for caller compatibility but no
  // longer changes behavior (a plain click already toggles within the set).
  toggleSelection: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
}

const DEFAULT_BOARD_NAME = "Untitled board";
const DEFAULT_SECTION_NAME = "New section";

// Monotonic counter for stable createdAt-like ordering. Date.now() is avoided
// so behaviour stays deterministic and testable; ordering is all we need.
let seq = 0;
const nextSeq = () => ++seq;

const mediaAspect = (naturalW: number, naturalH: number): number => {
  if (naturalW > 0 && naturalH > 0) return naturalH / naturalW;
  return 1;
};

export const useBoardLibraryStore = create<BoardLibraryState>()(
  persist(
    (set, get) => ({
      boards: {},
      boardOrder: [],
      activeBoardId: null,
      viewMode: "grid",
      density: "comfortable",

      searchQuery: "",
      activeTagFilters: [],
      ratingFilter: 0,
      selectedItemIds: new Set(),

      ensureActiveBoard: () => {
        const { activeBoardId, boards } = get();
        if (activeBoardId && boards[activeBoardId]) return activeBoardId;
        const firstId = get().boardOrder[0];
        if (firstId && boards[firstId]) {
          set({ activeBoardId: firstId });
          return firstId;
        }
        return get().createBoard();
      },

      createBoard: (name) => {
        const id = uuidv4();
        const order = nextSeq();
        const board: Board = {
          id,
          name: name?.trim() || DEFAULT_BOARD_NAME,
          createdAt: order,
          updatedAt: order,
          itemOrder: [],
          items: {},
          sections: [],
        };
        set((s) => ({
          boards: { ...s.boards, [id]: board },
          boardOrder: [...s.boardOrder, id],
          activeBoardId: id,
        }));
        return id;
      },

      renameBoard: (id, name) => {
        set((s) => {
          const board = s.boards[id];
          if (!board) return s;
          return {
            boards: {
              ...s.boards,
              [id]: { ...board, name: name.trim() || DEFAULT_BOARD_NAME },
            },
          };
        });
      },

      deleteBoard: (id) => {
        set((s) => {
          if (!s.boards[id]) return s;
          Object.values(s.boards[id].items).forEach(revokeBlobSrc);
          const boards = { ...s.boards };
          delete boards[id];
          const boardOrder = s.boardOrder.filter((b) => b !== id);
          const activeBoardId =
            s.activeBoardId === id ? boardOrder[0] ?? null : s.activeBoardId;
          return { boards, boardOrder, activeBoardId };
        });
      },

      setActiveBoard: (id) => {
        if (!get().boards[id]) return;
        set({ activeBoardId: id, selectedItemIds: new Set() });
      },

      addImageItem: (boardId, data) =>
        addItemToBoard(set, get, boardId, (base) => ({
          ...base,
          kind: "image",
          src: data.src,
          mediaId: data.mediaId,
          naturalW: data.naturalW,
          naturalH: data.naturalH,
          caption: data.caption ?? "",
          aspect: mediaAspect(data.naturalW, data.naturalH),
        })),

      addVideoItem: (boardId, data) =>
        addItemToBoard(set, get, boardId, (base) => ({
          ...base,
          kind: "video",
          src: data.src,
          mediaId: data.mediaId,
          naturalW: data.naturalW,
          naturalH: data.naturalH,
          aspect: mediaAspect(data.naturalW, data.naturalH),
        })),

      addTextItem: (boardId, text) =>
        addItemToBoard(set, get, boardId, (base) => ({
          ...base,
          kind: "text",
          text,
          aspect: TEXT_ITEM_ASPECT,
        })),

      addLinkItem: (boardId, data) =>
        addItemToBoard(set, get, boardId, (base) => ({
          ...base,
          kind: "link",
          url: data.url,
          title: data.title,
          description: data.description,
          image: data.image,
          aspect: data.image ? LINK_ITEM_ASPECT : TEXT_ITEM_ASPECT,
        })),

      addColorItem: (boardId, color) =>
        addItemToBoard(set, get, boardId, (base) => ({
          ...base,
          kind: "color",
          color,
          aspect: COLOR_ITEM_ASPECT,
        })),

      updateItem: (boardId, id, patch) => {
        set((s) => {
          const board = s.boards[boardId];
          if (!board || !board.items[id]) return s;
          const merged = { ...board.items[id], ...patch } as BoardItem;
          return {
            boards: {
              ...s.boards,
              [boardId]: {
                ...board,
                items: { ...board.items, [id]: merged },
                updatedAt: nextSeq(),
              },
            },
          };
        });
      },

      removeItems: (boardId, ids) => {
        if (ids.length === 0) return;
        set((s) => {
          const board = s.boards[boardId];
          if (!board) return s;
          const remove = new Set(ids);
          const items = { ...board.items };
          remove.forEach((id) => {
            revokeBlobSrc(items[id]);
            delete items[id];
          });
          const selectedItemIds = new Set(s.selectedItemIds);
          remove.forEach((id) => selectedItemIds.delete(id));
          return {
            boards: {
              ...s.boards,
              [boardId]: {
                ...board,
                items,
                itemOrder: board.itemOrder.filter((x) => !remove.has(x)),
                updatedAt: nextSeq(),
              },
            },
            selectedItemIds,
          };
        });
      },

      rateItems: (boardId, ids, rating) => {
        if (ids.length === 0) return;
        const clamped = Math.max(0, Math.min(5, Math.round(rating)));
        set((s) => {
          const board = s.boards[boardId];
          if (!board) return s;
          const items = { ...board.items };
          ids.forEach((id) => {
            const it = items[id];
            if (it) items[id] = { ...it, rating: clamped };
          });
          return {
            boards: {
              ...s.boards,
              [boardId]: { ...board, items, updatedAt: nextSeq() },
            },
          };
        });
      },

      createSection: (boardId, name) => {
        const id = uuidv4();
        set((s) => {
          const board = s.boards[boardId];
          if (!board) return s;
          const section = { id, name: name?.trim() || DEFAULT_SECTION_NAME };
          return {
            boards: {
              ...s.boards,
              [boardId]: {
                ...board,
                sections: [...board.sections, section],
                updatedAt: nextSeq(),
              },
            },
          };
        });
        return id;
      },

      renameSection: (boardId, sectionId, name) => {
        set((s) => {
          const board = s.boards[boardId];
          if (!board) return s;
          return {
            boards: {
              ...s.boards,
              [boardId]: {
                ...board,
                sections: board.sections.map((sec) =>
                  sec.id === sectionId
                    ? { ...sec, name: name.trim() || DEFAULT_SECTION_NAME }
                    : sec,
                ),
              },
            },
          };
        });
      },

      deleteSection: (boardId, sectionId) => {
        set((s) => {
          const board = s.boards[boardId];
          if (!board) return s;
          // Items in the section fall back to the ungrouped flow.
          const items = { ...board.items };
          for (const [id, it] of Object.entries(items)) {
            if (it.sectionId === sectionId) items[id] = { ...it, sectionId: null };
          }
          return {
            boards: {
              ...s.boards,
              [boardId]: {
                ...board,
                items,
                sections: board.sections.filter((sec) => sec.id !== sectionId),
                updatedAt: nextSeq(),
              },
            },
          };
        });
      },

      toggleSectionCollapsed: (boardId, sectionId) => {
        set((s) => {
          const board = s.boards[boardId];
          if (!board) return s;
          return {
            boards: {
              ...s.boards,
              [boardId]: {
                ...board,
                sections: board.sections.map((sec) =>
                  sec.id === sectionId
                    ? { ...sec, collapsed: !sec.collapsed }
                    : sec,
                ),
              },
            },
          };
        });
      },

      assignItemsToSection: (boardId, ids, sectionId) => {
        if (ids.length === 0) return;
        set((s) => {
          const board = s.boards[boardId];
          if (!board) return s;
          const target = new Set(ids);
          const items = { ...board.items };
          target.forEach((id) => {
            const it = items[id];
            if (it) items[id] = { ...it, sectionId };
          });
          return {
            boards: {
              ...s.boards,
              [boardId]: { ...board, items, updatedAt: nextSeq() },
            },
          };
        });
      },

      setViewMode: (mode) => set({ viewMode: mode }),
      setDensity: (density) => set({ density }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      toggleTagFilter: (tag) =>
        set((s) => ({
          activeTagFilters: s.activeTagFilters.includes(tag)
            ? s.activeTagFilters.filter((t) => t !== tag)
            : [...s.activeTagFilters, tag],
        })),
      setRatingFilter: (min) => set({ ratingFilter: Math.max(0, Math.min(5, min)) }),
      clearFilters: () =>
        set({ searchQuery: "", activeTagFilters: [], ratingFilter: 0 }),

      setSelection: (ids) => set({ selectedItemIds: new Set(ids) }),
      // Every click accumulates: a plain click adds the item to the current
      // selection (or removes it if already selected), so clicking item after
      // item builds up a multi-selection without needing a modifier. The
      // `additive` flag (ctrl/cmd/shift-click) behaves identically here; the
      // distinction is only meaningful for marquee/range selection.
      toggleSelection: (id) =>
        set((s) => {
          const next = new Set(s.selectedItemIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { selectedItemIds: next };
        }),
      clearSelection: () => set({ selectedItemIds: new Set() }),
      deleteSelected: () => {
        const { activeBoardId, selectedItemIds } = get();
        if (!activeBoardId || selectedItemIds.size === 0) return;
        get().removeItems(activeBoardId, Array.from(selectedItemIds));
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Only the library + view prefs persist; selection/search are per-session.
      // Blob-backed items are dropped — their object URLs die with the document,
      // so persisting them would only resurrect broken tiles after a reload.
      partialize: (s): PersistedLibrary => ({
        boards: stripEphemeralItems(s.boards),
        boardOrder: s.boardOrder,
        activeBoardId: s.activeBoardId,
        viewMode: s.viewMode,
        density: s.density,
      }),
      // Keep `seq` ahead of any restored ordering values so new items always
      // sort after persisted ones.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        let max = 0;
        Object.values(state.boards).forEach((b) => {
          max = Math.max(max, b.createdAt, b.updatedAt);
          Object.values(b.items).forEach((it) => {
            max = Math.max(max, it.createdAt);
          });
        });
        seq = Math.max(seq, max);
      },
    },
  ),
);

// ---------- helpers ----------

// Returns an item's blob: object URL, or null if it isn't blob-backed. Narrows
// to image/video internally so callers get a plain string back.
const blobSrc = (item: BoardItem): string | null => {
  if (item.kind !== "image" && item.kind !== "video") return null;
  return item.src.startsWith("blob:") ? item.src : null;
};

// Release an item's object URL when it leaves the store, so dropped/uploaded
// blobs don't pin their backing File for the life of the document.
const revokeBlobSrc = (item: BoardItem | undefined): void => {
  const src = item ? blobSrc(item) : null;
  if (!src) return;
  try {
    URL.revokeObjectURL(src);
  } catch {
    // ignore
  }
};

// Persistence view of the boards with blob-backed (ephemeral) items removed and
// their order entries pruned. Non-blob image/video (library picks) are kept.
const stripEphemeralItems = (
  boards: Record<string, Board>,
): Record<string, Board> => {
  const out: Record<string, Board> = {};
  for (const [boardId, board] of Object.entries(boards)) {
    const items: Record<string, BoardItem> = {};
    for (const [itemId, item] of Object.entries(board.items)) {
      if (!blobSrc(item)) items[itemId] = item;
    }
    out[boardId] = {
      ...board,
      items,
      itemOrder: board.itemOrder.filter((id) => items[id]),
    };
  }
  return out;
};

// Shared item-insertion path used by every typed creator. The `build` callback
// receives the filled base fields and returns the full discriminated item.
const addItemToBoard = (
  set: (fn: (s: BoardLibraryState) => Partial<BoardLibraryState>) => void,
  get: () => BoardLibraryState,
  boardId: string,
  build: (base: {
    id: string;
    sectionId: null;
    createdAt: number;
    tags: string[];
    rating: number;
  }) => BoardItem,
): string => {
  const id = uuidv4();
  const item = build({
    id,
    sectionId: null,
    createdAt: nextSeq(),
    tags: [],
    rating: 0,
  });
  set((s) => {
    const board = s.boards[boardId];
    if (!board) return s;
    return {
      boards: {
        ...s.boards,
        [boardId]: {
          ...board,
          items: { ...board.items, [id]: item },
          itemOrder: [...board.itemOrder, id],
          updatedAt: nextSeq(),
        },
      },
    };
  });
  return id;
};
