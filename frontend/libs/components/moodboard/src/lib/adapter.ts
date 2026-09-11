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

/** Summary row for a remotely persisted board (one mood_board project). */
export interface RemoteBoardMeta {
  token: string;
  name: string;
  /** ISO timestamp of the server row's last update. */
  updatedAt: string;
}

// Server persistence seam for boards. Each board maps to one mood_board
// project document on the backend; `saveBoard` creates the row when `token`
// is null and overwrites it otherwise. All members are promise-based and
// MUST NOT throw (failures come back as { success: false } / empty results)
// — the sync layer treats a rejection as an implementation bug.
export interface MoodboardPersistenceAdapter {
  /** Stable id of the signed-in account, or null when logged out. Sync only
   *  runs for signed-in users, hydration is keyed per account, and boards
   *  are stamped with this id to block cross-account pushes. */
  getUserId: () => string | null;
  /** Notify when the auth state may have changed (session fetch resolving,
   *  logout, account switch). Returns an unsubscribe. Without this, a
   *  session that resolves after mount would never enable sync, and an
   *  account switch would keep syncing as the previous user. */
  subscribeAuthState?: (onChange: () => void) => () => void;
  saveBoard: (args: {
    token: string | null;
    name: string;
    documentJson: string;
  }) => Promise<{ success: boolean; token?: string; errorMessage?: string }>;
  listBoards: () => Promise<{ success: boolean; boards?: RemoteBoardMeta[] }>;
  loadBoard: (
    token: string,
  ) => Promise<{ success: boolean; documentJson?: string }>;
  deleteBoard?: (token: string) => Promise<boolean>;
  /** Batch-resolve media tokens to display URLs, for items whose blob src
   *  couldn't be persisted. Missing tokens are simply absent from the map. */
  resolveMediaUrls?: (tokens: string[]) => Promise<Record<string, string>>;
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

  /** Optional server persistence. When present (and the user is signed in),
   *  the workspace autosaves boards as mood_board project documents and
   *  hydrates remote boards on mount. Omit for localStorage-only platforms. */
  persistence?: MoodboardPersistenceAdapter;
}
