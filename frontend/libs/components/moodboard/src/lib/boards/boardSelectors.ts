import { useBoardLibraryStore } from "./BoardLibraryStore";
import { Board, BoardItem } from "./boardTypes";

export const useActiveBoard = (): Board | null =>
  useBoardLibraryStore((s) =>
    s.activeBoardId ? s.boards[s.activeBoardId] ?? null : null,
  );

// Items in display order, narrowed by search query, tag filters, and a minimum
// rating. Pure so the grid can memoize on (board, query, tagFilters, minRating).
export const filterItems = (
  board: Board,
  query: string,
  tagFilters: string[],
  minRating = 0,
): BoardItem[] => {
  const q = query.trim().toLowerCase();
  return board.itemOrder
    .map((id) => board.items[id])
    .filter((it): it is BoardItem => Boolean(it))
    .filter((it) => {
      if (minRating > 0 && it.rating < minRating) return false;
      if (tagFilters.length && !tagFilters.every((t) => it.tags.includes(t))) {
        return false;
      }
      return q ? itemMatchesText(it, q) : true;
    });
};

// All distinct tags across a board, for the filter chips.
export const collectTags = (board: Board): string[] => {
  const seen = new Set<string>();
  board.itemOrder.forEach((id) => {
    board.items[id]?.tags.forEach((t) => seen.add(t));
  });
  return Array.from(seen).sort();
};

const itemMatchesText = (it: BoardItem, q: string): boolean => {
  if (it.tags.some((t) => t.toLowerCase().includes(q))) return true;
  switch (it.kind) {
    case "text":
      return it.text.toLowerCase().includes(q);
    case "link":
      return `${it.title} ${it.description} ${it.url}`.toLowerCase().includes(q);
    case "image":
      return it.caption.toLowerCase().includes(q);
    case "color":
      return it.color.toLowerCase().includes(q);
    default:
      return false;
  }
};
