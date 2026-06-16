// The board model is the source of truth for the moodboard feature. Both the
// Grid view (virtualized masonry) and the Canvas view render from it. Items
// carry a deterministic `aspect` so the masonry positioner can lay out and
// virtualize without measuring the DOM.

export type BoardItemKind = "image" | "video" | "text" | "link" | "color";

export type ViewMode = "grid" | "canvas";

// Grid density maps to a target column width + gap (see gridLayout.ts). Named
// rather than numeric so it reads well in the UI and persists stably.
export type GridDensity = "comfortable" | "cozy" | "compact";

interface BoardItemBase {
  id: string;
  kind: BoardItemKind;
  // null = ungrouped (lives in the board's default flow).
  sectionId: string | null;
  createdAt: number;
  tags: string[];
  // height / width ratio used by the masonry positioner.
  aspect: number;
  // 0 = unrated; 1-5 reserved for Lightroom-style triage (Phase 3).
  rating: number;
}

export interface BoardImageItem extends BoardItemBase {
  kind: "image";
  src: string;
  mediaId: string | null;
  naturalW: number;
  naturalH: number;
  caption: string;
}

export interface BoardVideoItem extends BoardItemBase {
  kind: "video";
  src: string;
  mediaId: string | null;
  naturalW: number;
  naturalH: number;
}

export interface BoardTextItem extends BoardItemBase {
  kind: "text";
  text: string;
}

export interface BoardLinkItem extends BoardItemBase {
  kind: "link";
  url: string;
  title: string;
  description: string;
  image: string | null;
}

export interface BoardColorItem extends BoardItemBase {
  kind: "color";
  color: string;
}

export type BoardItem =
  | BoardImageItem
  | BoardVideoItem
  | BoardTextItem
  | BoardLinkItem
  | BoardColorItem;

export interface BoardSection {
  id: string;
  name: string;
  // Header-collapsed in the grid. Persists so a tidied board stays tidy.
  collapsed?: boolean;
}

export interface Board {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  // Display / z order for items in the grid.
  itemOrder: string[];
  items: Record<string, BoardItem>;
  sections: BoardSection[];
}

// Nominal aspect ratios for non-media items, so masonry stays deterministic.
export const TEXT_ITEM_ASPECT = 0.62;
export const LINK_ITEM_ASPECT = 0.92;
export const COLOR_ITEM_ASPECT = 1;
