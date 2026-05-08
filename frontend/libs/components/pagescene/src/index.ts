// Public API for @storyteller/ui-pagescene.

// Adapter (platform abstraction)
export type {
  PageSceneAdapter,
  PageSceneGenerateRequest,
  PageSceneSavePayload,
} from "./lib/adapter";

// Store
export { usePageSceneStore } from "./lib/PageSceneStore";
export type {
  Camera,
  FocalLengthDragging,
  SceneObject,
  SceneObjectKind,
  OutlinerItem,
  ObjectPanelObject,
  DragPosition,
  PrecisionSelectorCoords,
  SelectedSceneObject,
  TransformMode,
  TransformSpace,
  PoseMode,
  HotkeyStatus,
  EditorLoader,
} from "./lib/PageSceneStore";
export { DomLevels } from "./lib/PageSceneStore";

// Enums (canonical for both lib + artcraft host)
export {
  AssetType,
  AssetFilterOption,
  ClipGroup,
  CameraAspectRatio,
  EditorStates,
} from "./lib/enums";

// Datastructures
export type { XYZ, Simple3DVector } from "./lib/datastructures/common";

// Models (lib-internal types — only what's needed at the public boundary)
export type { MediaItem, AudioMediaItem } from "./lib/models/assets";
