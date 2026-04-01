// Public API for @storyteller/ui-pagedraw

// Main component
export { default as PageDraw } from "./lib/PageDraw";
export { BlankCanvasModal } from "./lib/BlankCanvasModal";
export { HistoryStack } from "./lib/HistoryStack";

// Store
export { useSceneStore, generateId } from "./lib/stores/SceneState";
export type { SceneState, AspectRatioType, LineNode } from "./lib/stores/SceneState";

// Adapter interface
export type { PageDrawAdapter, PageDrawEditRequest, PageDrawInpaintRequest } from "./lib/adapter";

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
