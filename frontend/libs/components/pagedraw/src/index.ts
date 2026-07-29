// Public API for @storyteller/ui-pagedraw

// Main component
export { default as PageDraw } from "./lib/PageDraw";
export { BlankCanvasModal } from "./lib/BlankCanvasModal";
export { HistoryStack } from "./lib/HistoryStack";

// Store
export { useSceneStore, generateId } from "./lib/stores/SceneState";
export type { SceneState, AspectRatioType, LineNode } from "./lib/stores/SceneState";

// Adapter interface
export type {
  PageDrawAdapter,
  PageDrawEditRequest,
  PageDrawInpaintRequest,
  PageDrawPersistenceAdapter,
} from "./lib/adapter";

// Session persistence (server autosave + local replica). UI reads
// useDrawSessionStore reactively and issues intents via the command
// functions — one-way flow, no direct store writes from components.
export {
  initDrawSessionSync,
  teardownDrawSessionSync,
  saveSessionNow,
  nameSession,
  newSession,
  openSession,
  listSessions,
  resolveSessionConflict,
} from "./lib/persistence/sessionSync";
export { useDrawSessionStore } from "./lib/persistence/sessionStore";
export type {
  DrawSessionState,
  DrawSaveStatus,
  DrawHydrationState,
  DrawSessionConflict,
} from "./lib/persistence/sessionStore";
export type { PageDrawDocument } from "./lib/persistence/documentSchema";

// Shared types
export type { BaseSelectorImage, ImageBundle, DragState } from "./lib/types";

// Node
export { Node } from "./lib/Node";

// Hooks (used by PageEdit)
export { useCopyPasteHotkeys } from "./lib/hooks/useCopyPasteHotkeys";
export { useDeleteHotkeys } from "./lib/hooks/useDeleteHotkeys";
export { useUndoRedoHotkeys } from "./lib/hooks/useUndoRedoHotkeys";
export { useGlobalMouseUp } from "./lib/hooks/useGlobalMouseUp";
export { useStageCentering } from "./lib/hooks/useCenteredStage";
export { useRightPanelLayoutManagement } from "./lib/hooks/useRightPanelLayoutManagement";

// UI components (used by PageEdit)
export { ContextMenuContainer } from "./lib/components/ui/ContextMenu";
export { default as SplitPane } from "./lib/components/ui/SplitPane";
