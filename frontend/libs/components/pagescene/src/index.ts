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

// Models
export type { MediaItem, AudioMediaItem } from "./lib/models/assets";
export type { SceneGenereationMetaData } from "./lib/models/sceneGenerationMetadata";

// Engine — main entry point for hosts. Editor takes a PageSceneAdapter
// at construction; everything platform-specific (HTTP, signals, auth)
// flows through that single surface.
export { default as Editor } from "./lib/engine/editor";
export type { EditorInitializeConfig } from "./lib/engine/editor";
export { default as Scene } from "./lib/engine/scene";
export type { SceneDeps } from "./lib/engine/scene";
export { SceneUtils } from "./lib/engine/helper";
export type { SceneUtilsDeps } from "./lib/engine/helper";
export { SaveManager } from "./lib/engine/save_manager";
export type { SaveManagerDeps, SaveSceneStateArgs } from "./lib/engine/save_manager";
export { SceneManager } from "./lib/engine/scene_manager_api";
export { MouseControls } from "./lib/engine/keybinds_controls";
export type { MouseControlsDeps } from "./lib/engine/keybinds_controls";
export { buildKeymap, dispatchBinding } from "./lib/engine/keymap";
export type { KeyBinding, KeyGroup } from "./lib/engine/keymap";

// Engine subsystems
export { HistoryManager } from "./lib/engine/editor/HistoryManager";
export type { UndoableAction, HistoryManagerOptions } from "./lib/engine/editor/HistoryManager";
export { ViewportController } from "./lib/engine/editor/ViewportController";
export type { ViewportEngineRefs } from "./lib/engine/editor/ViewportController";
export { PostProcessingPipeline } from "./lib/engine/editor/PostProcessingPipeline";
export { GizmoController } from "./lib/engine/editor/GizmoController";
export type { GizmoControllerDeps, GizmoCallbacks } from "./lib/engine/editor/GizmoController";
export { CameraController } from "./lib/engine/editor/CameraController";
export type { CameraControllerDeps, RenderDimensions } from "./lib/engine/editor/CameraController";
export { SelectionBridge } from "./lib/engine/editor/SelectionBridge";
export type { SelectionBridgeDeps } from "./lib/engine/editor/SelectionBridge";

// Action classes (UndoableAction implementations) — exported so
// host-side action dispatchers can construct them.
export { ColorAction } from "./lib/engine/editor/actions/ColorAction";
export { CreateAction } from "./lib/engine/editor/actions/CreateAction";
export { DeleteAction } from "./lib/engine/editor/actions/DeleteAction";
export { LockAction } from "./lib/engine/editor/actions/LockAction";
export { TransformAction } from "./lib/engine/editor/actions/TransformAction";
export { VisibilityAction } from "./lib/engine/editor/actions/VisibilityAction";

// Engine utilities exported for host wrappers + hooks.
export { pickDropPosition } from "./lib/engine/pickDropPosition";
export {
  freeCamFrameTick,
  lookAtFromCamera,
  createFreeCamControlState,
  emptyMoveKeys,
  emptyRotateKeys,
  moveSlotForKeyCode,
  rotateSlotForKeyCode,
  panFromDrag,
  zoomFromWheel,
  moveVectorFromKeys,
  rotationVectorFromKeys,
  lerpVelocity,
} from "./lib/engine/cameraMath";
export type {
  FreeCamControlState,
  HeldMoveKeys,
  HeldRotateKeys,
} from "./lib/engine/cameraMath";
export {
  ndcFromClient,
  applyNdcToVector2,
} from "./lib/engine/pointer";
export { isPointerLockSupported } from "./lib/engine/browserChecks";

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
