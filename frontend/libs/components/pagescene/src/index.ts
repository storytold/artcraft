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

// Engine event bus + event classes (host wrappers can emit
// GridVisibleChangedEvent etc. through editor.bus to keep the
// one-way write flow). Class identity is single-sourced from the
// lib so emit/subscribe lookups share the same constructor key.
export { EngineEventBus } from "./lib/engine/events/EngineEventBus";
export { EngineStoreBridge } from "./lib/engine/EngineStoreBridge";
export type { EngineStoreBridgeDeps } from "./lib/engine/EngineStoreBridge";
export type {
  EngineEventCtor,
  EngineEventListener,
} from "./lib/engine/events/EngineEventBus";
export {
  EngineEvent,
  EngineInitializedEvent,
  SceneLoadedEvent,
  SceneResetEvent,
  SelectionChangedEvent,
  InspectorPanelChangedEvent,
  ObjectAddedEvent,
  ObjectRemovedEvent,
  OutlinerRefreshedEvent,
  OutlinerSelectedItemChangedEvent,
  OutlinerItemLockToggledEvent,
  OutlinerItemVisibilityToggledEvent,
  TransformModeChangedEvent,
  TransformSpaceChangedEvent,
  SelectedModeChangedEvent,
  EditorStateChangedEvent,
  EditorLoaderEvent,
  PoseControlsVisibilityChangedEvent,
  PoseModeChangedEvent,
  AssetModalVisibilityChangedEvent,
  GridVisibleChangedEvent,
  CameraAspectRatioChangedEvent,
  CamerasReplacedEvent,
  SelectedCameraChangedEvent,
  CameraUpdatedEvent,
} from "./lib/engine/events/EngineEvent";
