import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type DeckItemKind = "image" | "video" | "audio" | "mesh";

/**
 * Neutral reference item consumed by the deck UI. Callers adapt their own
 * ref shapes (desktop promptStore RefImage/RefVideo/RefAudio, webapp
 * RefImage with fullUrl) into this.
 */
export interface DeckItem {
  id: string;
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
  key: string;
  label: string;
  icon?: IconDefinition;
  onSelect: () => void;
  disabled?: boolean;
  /** Menu section ("image" | "video" | "audio"); shown as a header when the
   *  menu spans multiple groups. */
  group?: string;
}
