// Public API for @storyteller/ui-pagescene.

// Top-level component — the host mounts this inside its route/tab.
export { Stage3D } from "./lib/Stage3D";
export type { Stage3DProps } from "./lib/Stage3D";

// Adapter (platform abstraction)
export type {
  PageSceneAdapter,
  PageSceneGenerateRequest,
  PageSceneSavePayload,
  ListMediaFilesQuery,
  ListUserMediaFilesResult,
  ListFeaturedMediaFilesResult,
} from "./lib/adapter";

// Store
export {
  usePageSceneStore,
  useIsVisitingOthersScene,
  getIsVisitingOthersScene,
} from "./lib/PageSceneStore";
export type {
  Camera,
  FocalLengthDragging,
  SceneMeta,
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
  FilterEngineCategories,
  FilterMediaClasses,
  FilterMediaType,
  MediaFileType,
  MediaFileSubtype,
  MediaFileClass,
  ToastTypes,
  WeightCategory,
  WeightType,
  Visibility,
  FetchStatus,
  GenerateTtsAudioErrorType,
  JobState,
  ArtStyle,
} from "./lib/enums";

// Datastructures
export type { XYZ, Simple3DVector } from "./lib/datastructures/common";

// Models — full scene-related model surface. Host modules that
// previously imported from apps/.../PageScene/models can switch
// to importing from here.
export type { MediaItem, AudioMediaItem } from "./lib/models/assets";
export type { SceneGenereationMetaData } from "./lib/models/sceneGenerationMetadata";
export type {
  MediaInfo,
  MaybeResult,
  Request,
  Status,
  ActiveJob,
} from "./lib/models/mediaInfo";
export type {
  Pagination,
  PaginationInfinite,
} from "./lib/models/pagination";
export type { Prompts } from "./lib/models/prompts";
export type {
  UserDetailsLight,
  DefaultAvatarInfo,
  MediaFile,
  GetMediaListResponse,
  GetMediaFileResponse,
  VoiceConversionModelListItem,
  VoiceConversionModelListResponse,
  CreatorDetails,
} from "./lib/models/types";
export type {
  UserBookmarkBatch,
  UserBookmarkByEntity,
  UserBookmarkByUser,
} from "./lib/models/userBookmark";

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
export type {
  KeyBinding,
  KeyGroup as KeymapKeyGroup,
} from "./lib/engine/keymap";

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

// Action dispatchers — host UI calls these to manipulate the scene
// (drop assets, transform objects, color picks, etc.).
export {
  addCharacter,
  addObject,
  addShape,
  deleteObject,
  selectObject,
  deselectObject,
  setCameraAspect,
  setObjectColor,
  beginColorSession,
  setTransformMode,
  toggleObjectLock,
  toggleObjectVisibility,
  beginTransformSession,
} from "./lib/actions";
export type { ColorSession, TransformSession } from "./lib/actions";

// Hooks — engine + DOM glue used by the lib's React components and
// any host that mounts custom UI inside the editor.
export { useEditorCanvas, useCamViewCanvas } from "./lib/hooks/useEditorCanvas";
export { useFreeCam } from "./lib/hooks/useFreeCam";
export { useViewportPointer } from "./lib/hooks/useViewportPointer";
export { useViewportKeyboard } from "./lib/hooks/useViewportKeyboard";

// Engine context — React tree access to the live Editor instance.
export {
  EngineContext,
  setActiveEditor,
  getActiveEditor,
} from "./lib/contexts/EngineContext/EngineContext";
export type { EditorExpandedI } from "./lib/contexts/EngineContext/EngineContext";
export { EngineProvider } from "./lib/contexts/EngineContext/EngineProvider";

// Drag-and-drop singleton (used by AssetMenu items + GalleryDragComponent).
export { default as dragAndDrop } from "./lib/DragAndDrop/DndAsset";

// Scene-generation metadata helper (used by save flow + cache snapshot).
export { getSceneGenerationMetaData } from "./lib/sceneMetadata";

// React UI components. Viewport-dependent comps read viewport size
// through useViewportSize, which falls back to window.innerWidth/
// innerHeight when no host adapter is available.
//
// Host-coupled comps (AssetMenu, ControlsTopButtons, Controls3D,
// EditorLoadingBar, OnboardingHelper) stay in the artcraft host
// until their dependencies (UploadModal3D, MediaFilesApi,
// signalScene, addToast, loadingBarData/IsShowing signals, etc.)
// are either surfaced via adapter slots or replaced with
// lib-internal state.
export { AnonHintChip } from "./lib/comps/AnonHintChip";
export { AssetMenu, AssetModal } from "./lib/comps/AssetMenu";
export { Controls3D } from "./lib/comps/Controls3D";
export { ControlsTopButtons } from "./lib/comps/ControlsTopButtons";
export { DragComponent } from "./lib/comps/DragComponent/DragComponent";
export { PrecisionSelector } from "./lib/comps/PrecisionSelector/PrecisionSelector";
export { FocalLengthDisplay } from "./lib/comps/FocalLengthDisplay/FocalLengthDisplay";
export { AspectRatioMenu } from "./lib/comps/AspectRatioMenu/AspectRatioMenu";
export { PoseModeSelector } from "./lib/comps/PoseModeSelector";
export { EditorCanvas, CameraViewCanvas } from "./lib/comps/EngineCanvases";
export { Outliner } from "./lib/comps/Outliner";
export { ControlPanelSceneObject } from "./lib/comps/ControlPanelSceneObject";
export { SceneContainer } from "./lib/comps/SceneContainer";
export { PreviewBox } from "./lib/comps/PreviewBox";
export type { PreviewBoxProps } from "./lib/comps/PreviewBox";
export { PreviewEngineCamera } from "./lib/comps/PreviewEngineCamera";
export { PreviewImages } from "./lib/comps/PreviewImages";
export { OnboardingHelper } from "./lib/comps/OnboardingHelper";
export { EditorLoadingBar } from "./lib/comps/EditorLoadingBar";
export {
  Help,
  Key,
  KeyGroup,
  Mouse,
  Plus,
  ShortcutsGroup,
} from "./lib/comps/ControlsTopButtons/Help/Help";

// Viewport-size hook (also useful to host code that wants the same
// reactivity contract the lib comps use).
export { useViewportSize } from "./lib/hooks/useViewportSize";

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
