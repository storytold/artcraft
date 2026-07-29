import { create } from "zustand";

// Reactive session/persistence state for pagedraw. One-way flow: only the
// sync controller (sessionSync.ts) writes here; UI components subscribe with
// selectors and issue intents through the controller's exported commands
// (saveSessionNow, nameSession, resolveSessionConflict, ...). UI never
// mutates this store directly.

export type DrawSaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error"
  /**
   * Another device/session advanced the server copy past the revision this
   * session last synced with. Autosave is paused until the user resolves via
   * resolveSessionConflict — no side is silently overwritten.
   */
  | "conflict";

export type DrawHydrationState = "idle" | "hydrating" | "ready";

export interface DrawSessionConflict {
  /** The server copy's updated_at that superseded our base revision. */
  serverUpdatedAt: string;
}

export interface DrawSessionState {
  /** User-facing session name; empty until the user names the session. */
  sessionName: string;
  /**
   * True once the user has named the session (the trigger for server row
   * creation — unnamed work is protected locally but never creates rows).
   */
  isNamed: boolean;
  /** Server project token; null until the first successful named save. */
  remoteToken: string | null;
  hydration: DrawHydrationState;
  saveStatus: DrawSaveStatus;
  /** Epoch ms of the last successful server save. */
  lastSavedAt: number | null;
  errorMessage: string | null;
  conflict: DrawSessionConflict | null;
  loggedIn: boolean;
}

const INITIAL_STATE: DrawSessionState = {
  sessionName: "",
  isNamed: false,
  remoteToken: null,
  hydration: "idle",
  saveStatus: "idle",
  lastSavedAt: null,
  errorMessage: null,
  conflict: null,
  loggedIn: false,
};

export const useDrawSessionStore = create<DrawSessionState>(() => ({
  ...INITIAL_STATE,
}));

/** Controller-only: reset to the pristine state (init / account switch). */
export const resetDrawSessionStore = (): void => {
  useDrawSessionStore.setState({ ...INITIAL_STATE });
};
