import type { ReactNode } from "react";

// Platform-specific seams the moodboard needs but can't own itself. Each app
// (desktop Tauri / web) supplies a concrete adapter; the lib stays portable.

export interface MoodboardReference {
  id: string;
  url: string;
  mediaToken: string;
}

export interface MoodboardPickedItem {
  url: string;
  mediaToken: string | null;
  kind: "image" | "video";
}

export interface MoodboardLibraryPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (items: MoodboardPickedItem[]) => void;
}

export interface MoodboardAdapter {
  /** Upload a file, resolving to a durable media token (or null if the platform
   *  can't provide one). When present, uploaded images become reference-capable
   *  and persist beyond the blob URL. */
  uploadImage?: (file: File) => Promise<string | null>;

  /** Push selected board images to the platform's generation surface
   *  (desktop: prompt store + tab switch; web: sessionStorage + route nav). */
  sendToGeneration: (refs: MoodboardReference[]) => void;

  /** Optional library/gallery picker as a render-prop. Omit to disable the
   *  "From library" action (e.g. when a platform's picker isn't wired yet). */
  renderLibraryPicker?: (props: MoodboardLibraryPickerProps) => ReactNode;
}
