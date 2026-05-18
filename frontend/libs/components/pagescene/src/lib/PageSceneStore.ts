import { create } from "zustand";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Camera, FocalLengthDragging } from "@storyteller/common";
import {
  AssetType,
  AssetFilterOption,
  CameraAspectRatio,
  ClipGroup,
  EditorStates,
} from "./enums";
import { MediaItem } from "./models";
import { Simple3DVector } from "./datastructures/common";

export type { Camera, FocalLengthDragging };

// Scene metadata — what host tracks in its `signalScene`. Mirrored
// into the store so ControlsTopButtons (lib-resident) can read it
// reactively. Host calls `setSceneMeta` whenever its signal changes.
export interface SceneMeta {
  title: string | undefined;
  token: string | undefined;
  ownerToken: string | undefined;
  isModified: boolean | undefined;
  isInitializing: boolean;
  // URL to the author's generation result for this scene, shown in
  // view-only mode's PreviewBox. Host populates this from the
  // adapter.loadScene response. Optional; absent ⇒ no preview rendered.
  previewImageUrl?: string;
}

export type SceneObjectKind = "object" | "character" | "shape";

export interface SceneObject {
  id: string;
  kind: SceneObjectKind;
  name: string;
  mediaId?: string;
  mediaToken?: string;
}

// Item in the outliner panel (with icon, visibility, lock state).
// Distinct from `SceneObject` — outliner tracks UI-side rows; the
// engine maintains its own object model.
export interface OutlinerItem {
  id: string;
  icon: IconDefinition;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

// The currently inspected object in the right-hand control panel.
// Distinct from both `SceneObject` and `OutlinerItem`; this carries
// engine-side identifiers used by the gizmo / property panel.
export interface ObjectPanelObject {
  group: ClipGroup;
  object_uuid: string;
  object_name: string;
  version: string;
  objectVectors: Simple3DVector;
}

export interface DragPosition {
  currX: number;
  currY: number;
}

export interface PrecisionSelectorCoords {
  x: number;
  y: number;
}

export interface SelectedSceneObject {
  type: AssetType;
  id: string;
}

export type TransformMode = "move" | "rotate" | "scale";
export type TransformSpace = "world" | "local";
export type PoseMode = "select" | "pose";

export enum DomLevels {
  NONE = 0,
  INPUT = 1,
  PANEL = 2,
  DIALOGUE = 3,
}

export interface HotkeyStatus {
  disabled: boolean;
  disabledBy: DomLevels;
}

export interface EditorLoader {
  isShowing: boolean;
  message: string | undefined;
}

const DEFAULT_CAMERAS: Camera[] = [
  {
    id: "main",
    label: "Main View",
    focalLength: 17,
    position: { x: -2.5, y: 2.5, z: 2.5 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: 0 },
  },
  {
    id: "cam2",
    label: "Camera 2",
    focalLength: 10,
    position: { x: 0, y: 0.6, z: 1.5 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: 0 },
  },
];

interface PageSceneState {
  // scene contents
  objects: SceneObject[];
  characters: SceneObject[];
  shapes: SceneObject[];
  selectedObject: SelectedSceneObject | null;

  // cameras
  cameras: Camera[];
  selectedCameraId: string;
  cameraAspectRatio: CameraAspectRatio;
  focalLengthDragging: FocalLengthDragging;
  cameraFilter: AssetFilterOption;

  // editor mode
  editorState: EditorStates;
  transformMode: TransformMode;
  transformSpace: TransformSpace;
  selectedMode: string;
  poseMode: PoseMode;
  showPoseControls: boolean;
  gridVisible: boolean;
  ignoreKeyDelete: boolean;
  hotkeyStatus: HotkeyStatus;
  isPromptBoxFocused: boolean;

  // layout / panels
  assetModalVisible: boolean;
  assetModalVisibleDuringDrag: boolean;
  reopenAfterDrag: boolean;

  // overlays
  editorLoader: EditorLoader;
  editorLetterBox: boolean;
  // Three.js perf stats panel (FPS / ms / mb). Toggled via the
  // backtick keybind. Owned by React (PerfStatsOverlay) so the panel
  // only renders inside PageScene and never leaks into other routes.
  statsVisible: boolean;
  showErrorDialog: boolean;
  errorDialogTitle: string;
  errorDialogMessage: string;

  // drag-and-drop
  canDrop: boolean;
  dragItem: MediaItem | null;
  dragPosition: DragPosition;

  // object panel (right-hand inspector for selected object)
  objectPanelShowing: boolean;
  objectPanelCurrent: ObjectPanelObject | undefined;

  // outliner (left-hand scene tree)
  outlinerItems: OutlinerItem[];
  outlinerSelectedItem: OutlinerItem | null;
  outlinerShowing: boolean;

  // precision selector popover
  precisionSelectorShowing: boolean;
  precisionSelectorCoords: PrecisionSelectorCoords;
  precisionSelectorValues: number[];
  precisionSelectedValue: number;

  // engine lifecycle flags (mirrored to other parts of the app)
  is3DPageMounted: boolean;
  is3DEditorInitialized: boolean;
  is3DSceneLoaded: boolean;

  // scene metadata — title/token/owner/dirty state. Mirrors what the
  // host's signalScene tracks so ControlsTopButtons (lib-resident)
  // can read it reactively without depending on host signals.
  sceneMeta: SceneMeta;
  // Current logged-in user (read from host auth signal). Used for
  // ownership permission checks in ControlsTopButtons.
  currentUserToken: string | undefined;
  // Host-owned full-screen overlay (e.g. webapp's splash modal) is
  // open. Lib components use this to suppress in-editor affordances
  // that would otherwise bleed visually through or behind the modal
  // (the empty-scene "Click + to add" bouncing hint, etc.). The host
  // toggles this via setHostOverlayVisible from its own modal store.
  hostOverlayVisible: boolean;

  // canvas DOM refs (set by canvas components on mount; consumed by
  // the engine + hooks)
  sceneContainerEl: HTMLDivElement | null;
  editorCanvasEl: HTMLCanvasElement | null;
  camViewCanvasEl: HTMLCanvasElement | null;

  // ----- actions -----

  // scene
  addObject: (obj: SceneObject) => void;
  addCharacter: (obj: SceneObject) => void;
  addShape: (obj: SceneObject) => void;
  removeSceneObject: (id: string) => void;
  setSelectedObject: (sel: SelectedSceneObject | null) => void;
  resetScene: () => void;

  // camera
  addCamera: (camera: Camera) => void;
  updateCamera: (id: string, updates: Partial<Camera>) => void;
  deleteCamera: (id: string) => void;
  setSelectedCameraId: (id: string) => void;
  setCameraAspectRatio: (ratio: CameraAspectRatio) => void;
  setFocalLengthDragging: (state: FocalLengthDragging) => void;
  setCameraFilter: (filter: AssetFilterOption) => void;

  // editor mode
  setEditorState: (state: EditorStates) => void;
  setTransformMode: (mode: TransformMode) => void;
  setTransformSpace: (space: TransformSpace) => void;
  setSelectedMode: (mode: string) => void;
  setPoseMode: (mode: PoseMode) => void;
  setShowPoseControls: (visible: boolean) => void;
  setGridVisible: (visible: boolean) => void;
  toggleStats: () => void;
  setIgnoreKeyDelete: (ignore: boolean) => void;
  disableHotkeyInput: (level: DomLevels) => void;
  enableHotkeyInput: (level: DomLevels) => void;
  setIsPromptBoxFocused: (focused: boolean) => void;

  // layout
  setAssetModalVisible: (visible: boolean) => void;
  setAssetModalVisibleDuringDrag: (visible: boolean) => void;
  setReopenAfterDrag: (reopen: boolean) => void;

  // overlays
  showEditorLoader: (message?: string) => void;
  hideEditorLoader: () => void;
  toggleEditorLetterBox: (next?: boolean) => void;
  setErrorDialog: (title: string, message: string) => void;
  setShowErrorDialog: (show: boolean) => void;

  // drag-and-drop
  setCanDrop: (canDrop: boolean) => void;
  setDragItem: (item: MediaItem | null) => void;
  setDragPosition: (pos: DragPosition) => void;

  // object panel
  showObjectPanel: (obj?: ObjectPanelObject) => void;
  hideObjectPanel: () => void;
  updateObjectPanel: (obj: ObjectPanelObject) => void;

  // outliner
  setOutlinerItems: (items: OutlinerItem[]) => void;
  setOutlinerSelectedItem: (item: OutlinerItem | null) => void;
  setOutlinerShowing: (showing: boolean) => void;
  selectOutlinerItem: (id: string) => void;
  toggleOutlinerVisibility: (id: string) => void;
  toggleOutlinerLock: (id: string) => void;

  // precision selector
  showPrecisionSelector: (
    coords: PrecisionSelectorCoords,
    values: number[],
  ) => void;
  hidePrecisionSelector: () => void;
  setPrecisionSelectedValue: (v: number) => void;

  // engine lifecycle
  set3DPageMounted: (mounted: boolean) => void;
  setIs3DEditorInitialized: (initialized: boolean) => void;
  setIs3DSceneLoaded: (loaded: boolean) => void;

  // scene metadata + auth — driven by host via lifecycle effects in
  // the host wrapper (e.g. apps/.../PageScene.tsx mirrors signalScene
  // and authentication.userInfo into these).
  setSceneMeta: (meta: Partial<SceneMeta>) => void;
  setCurrentUserToken: (token: string | undefined) => void;
  setHostOverlayVisible: (visible: boolean) => void;

  // canvas refs
  setSceneContainerEl: (el: HTMLDivElement | null) => void;
  setEditorCanvasEl: (el: HTMLCanvasElement | null) => void;
  setCamViewCanvasEl: (el: HTMLCanvasElement | null) => void;
}

export const usePageSceneStore = create<PageSceneState>((set, get) => ({
  // initial state
  objects: [],
  characters: [],
  shapes: [],
  selectedObject: null,

  cameras: DEFAULT_CAMERAS,
  selectedCameraId: "main",
  cameraAspectRatio: CameraAspectRatio.HORIZONTAL_3_2,
  focalLengthDragging: { isDragging: false, focalLength: 35 },
  cameraFilter: AssetFilterOption.ALL,

  editorState: EditorStates.EDIT,
  transformMode: "move",
  transformSpace: "world",
  selectedMode: "move",
  poseMode: "select",
  showPoseControls: false,
  gridVisible: true,
  ignoreKeyDelete: false,
  hotkeyStatus: { disabled: false, disabledBy: DomLevels.NONE },
  isPromptBoxFocused: false,

  assetModalVisible: false,
  assetModalVisibleDuringDrag: true,
  reopenAfterDrag: false,

  editorLoader: { isShowing: false, message: "Loading Editor Engine 🦊" },
  editorLetterBox: true,
  statsVisible: false,
  showErrorDialog: false,
  errorDialogTitle: "Error!",
  errorDialogMessage: "Something went wrong.",

  canDrop: false,
  dragItem: null,
  dragPosition: { currX: 0, currY: 0 },

  objectPanelShowing: false,
  objectPanelCurrent: undefined,

  outlinerItems: [],
  outlinerSelectedItem: null,
  outlinerShowing: false,

  precisionSelectorShowing: false,
  precisionSelectorCoords: { x: 0, y: 0 },
  precisionSelectorValues: [],
  precisionSelectedValue: 0,

  is3DPageMounted: false,
  is3DEditorInitialized: false,
  is3DSceneLoaded: false,

  sceneMeta: {
    title: undefined,
    token: undefined,
    ownerToken: undefined,
    isModified: undefined,
    isInitializing: true,
  },
  currentUserToken: undefined,
  hostOverlayVisible: false,

  sceneContainerEl: null,
  editorCanvasEl: null,
  camViewCanvasEl: null,

  // scene actions
  addObject: (obj) =>
    set((s) => ({ objects: [...s.objects, obj] })),
  addCharacter: (obj) =>
    set((s) => ({ characters: [...s.characters, obj] })),
  addShape: (obj) =>
    set((s) => ({ shapes: [...s.shapes, obj] })),
  removeSceneObject: (id) =>
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      characters: s.characters.filter((o) => o.id !== id),
      shapes: s.shapes.filter((o) => o.id !== id),
      selectedObject:
        s.selectedObject?.id === id ? null : s.selectedObject,
    })),
  setSelectedObject: (sel) => set({ selectedObject: sel }),
  resetScene: () =>
    set({ objects: [], characters: [], shapes: [], selectedObject: null }),

  // camera actions
  addCamera: (camera) => set((s) => ({ cameras: [...s.cameras, camera] })),
  updateCamera: (id, updates) =>
    set((s) => ({
      cameras: s.cameras.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  deleteCamera: (id) => {
    if (id === "main") return;
    set((s) => ({
      cameras: s.cameras.filter((c) => c.id !== id),
      selectedCameraId: s.selectedCameraId === id ? "main" : s.selectedCameraId,
    }));
  },
  setSelectedCameraId: (id) => set({ selectedCameraId: id }),
  setCameraAspectRatio: (ratio) => set({ cameraAspectRatio: ratio }),
  setFocalLengthDragging: (state) => set({ focalLengthDragging: state }),
  setCameraFilter: (filter) => set({ cameraFilter: filter }),

  // editor mode actions
  setEditorState: (state) => set({ editorState: state }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setTransformSpace: (space) => set({ transformSpace: space }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setPoseMode: (mode) => set({ poseMode: mode }),
  setShowPoseControls: (visible) => set({ showPoseControls: visible }),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  toggleStats: () => set((s) => ({ statsVisible: !s.statsVisible })),
  setIgnoreKeyDelete: (ignore) => set({ ignoreKeyDelete: ignore }),
  disableHotkeyInput: (level) => {
    const status = get().hotkeyStatus;
    if (status.disabled) {
      if (level > status.disabledBy) {
        set({ hotkeyStatus: { ...status, disabledBy: level } });
      }
    } else {
      set({ hotkeyStatus: { disabled: true, disabledBy: level } });
    }
  },
  enableHotkeyInput: (level) => {
    const status = get().hotkeyStatus;
    if (status.disabled && level >= status.disabledBy) {
      set({ hotkeyStatus: { disabled: false, disabledBy: DomLevels.NONE } });
    }
  },
  setIsPromptBoxFocused: (focused) => set({ isPromptBoxFocused: focused }),

  // layout actions
  setAssetModalVisible: (visible) => set({ assetModalVisible: visible }),
  setAssetModalVisibleDuringDrag: (visible) =>
    set({ assetModalVisibleDuringDrag: visible }),
  setReopenAfterDrag: (reopen) => set({ reopenAfterDrag: reopen }),

  // overlays actions
  showEditorLoader: (message) =>
    set({ editorLoader: { isShowing: true, message } }),
  hideEditorLoader: () =>
    set((s) => ({
      editorLoader: { isShowing: false, message: s.editorLoader.message },
    })),
  toggleEditorLetterBox: (next) =>
    set((s) => ({
      editorLetterBox: next !== undefined ? next : !s.editorLetterBox,
    })),
  setErrorDialog: (title, message) =>
    set({
      errorDialogTitle: title,
      errorDialogMessage: message,
      showErrorDialog: true,
    }),
  setShowErrorDialog: (show) => set({ showErrorDialog: show }),

  // drag-and-drop actions
  setCanDrop: (canDrop) => set({ canDrop }),
  setDragItem: (item) => set({ dragItem: item }),
  setDragPosition: (pos) => set({ dragPosition: pos }),

  // object panel actions
  showObjectPanel: (obj) =>
    set((s) => ({
      objectPanelShowing: true,
      objectPanelCurrent: obj ?? s.objectPanelCurrent,
    })),
  hideObjectPanel: () => set({ objectPanelShowing: false }),
  updateObjectPanel: (obj) => set({ objectPanelCurrent: obj }),

  // outliner actions
  setOutlinerItems: (items) => set({ outlinerItems: items }),
  setOutlinerSelectedItem: (item) => set({ outlinerSelectedItem: item }),
  setOutlinerShowing: (showing) => set({ outlinerShowing: showing }),
  selectOutlinerItem: (id) => {
    const item = get().outlinerItems.find((i) => i.id === id);
    if (item) set({ outlinerSelectedItem: item });
  },
  toggleOutlinerVisibility: (id) =>
    set((s) => ({
      outlinerItems: s.outlinerItems.map((i) =>
        i.id === id ? { ...i, visible: !i.visible } : i,
      ),
    })),
  toggleOutlinerLock: (id) =>
    set((s) => ({
      outlinerItems: s.outlinerItems.map((i) =>
        i.id === id ? { ...i, locked: !i.locked } : i,
      ),
    })),

  // precision selector actions
  showPrecisionSelector: (coords, values) =>
    set({
      precisionSelectorShowing: true,
      precisionSelectorCoords: coords,
      precisionSelectorValues: values,
    }),
  hidePrecisionSelector: () => set({ precisionSelectorShowing: false }),
  setPrecisionSelectedValue: (v) => set({ precisionSelectedValue: v }),

  set3DPageMounted: (mounted) => set({ is3DPageMounted: mounted }),
  setIs3DEditorInitialized: (initialized) =>
    set({ is3DEditorInitialized: initialized }),
  setIs3DSceneLoaded: (loaded) => set({ is3DSceneLoaded: loaded }),

  setSceneMeta: (meta) =>
    set((s) => ({ sceneMeta: { ...s.sceneMeta, ...meta } })),
  setCurrentUserToken: (token) => set({ currentUserToken: token }),
  setHostOverlayVisible: (visible) => set({ hostOverlayVisible: visible }),

  setSceneContainerEl: (el) => set({ sceneContainerEl: el }),
  setEditorCanvasEl: (el) => set({ editorCanvasEl: el }),
  setCamViewCanvasEl: (el) => set({ camViewCanvasEl: el }),
}));

// True when the visitor is looking at someone else's scene (owner is
// known and isn't them). A blank scene has no owner so this returns
// false; the scene owner viewing their own scene returns false too.
//
// This no longer gates mutations — visitors can fully interact with
// the scene. It only drives ownership-aware UI: the primary Save
// button switches to "Save copy" (forks the scene to the visitor's
// account on confirm) and the PreviewBox shows the author's
// generation result.
const computeIsVisitingOthersScene = (s: PageSceneState): boolean =>
  s.sceneMeta.ownerToken !== undefined &&
  s.sceneMeta.ownerToken !== s.currentUserToken;

export const useIsVisitingOthersScene = (): boolean =>
  usePageSceneStore(computeIsVisitingOthersScene);

export const getIsVisitingOthersScene = (): boolean =>
  computeIsVisitingOthersScene(usePageSceneStore.getState());
