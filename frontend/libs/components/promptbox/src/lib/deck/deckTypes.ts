import type { LucideIcon } from "lucide-react";

// The four kinds of reference the deck can show.
export type DeckItemKind = "image" | "video" | "audio" | "mesh";

/**
 * Neutral reference item consumed by the deck UI. Callers adapt their own
 * ref shapes (desktop promptStore RefImage/RefVideo/RefAudio, webapp
 * RefImage with fullUrl) into this.
 */
export interface DeckItem {
  // Unique key for the card.
  id: string;
  // Decides the card face: a thumbnail, an audio play tile, or a box icon for a mesh.
  kind: DeckItemKind;
  /** Thumbnail / object URL. Absent for audio. */
  url?: string;
  /** Full-res URL for the preview modal; falls back to `url`. */
  previewUrl?: string;
  /** Hover label — "Image 1", "Video 2", "Audio 1". Numbering owned by caller. */
  name: string;
  /** Seconds badge for video/audio cards. */
  duration?: number;
  /** True while its upload is in flight — blurred thumb + spinner overlay. */
  uploading?: boolean;
  /** False excludes an image card from drag-reorder (fixed slots like
   *  multi-view angles whose position is meaningful). Default true. */
  sortable?: boolean;
}

/** One entry in a deck "+" add menu (upload, pick from library, ...). */
export interface DeckAddAction {
  // Unique key for the menu row. When no icon is given, a key starting with "upload" gets the upload icon.
  key: string;
  // Text shown on the menu row.
  label: string;
  icon?: LucideIcon;
  // Runs when the row is clicked.
  onSelect: () => void;
  disabled?: boolean;
  /** Menu section ("image" | "video" | "audio"); shown as a header when the
   *  menu spans multiple groups. */
  group?: string;
}
