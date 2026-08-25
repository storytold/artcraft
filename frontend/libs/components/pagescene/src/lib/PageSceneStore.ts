import { create } from "zustand";
import type { LucideIcon } from "lucide-react";
import { Camera, FocalLengthDragging } from "@storyteller/common";
import {
  AssetType,
  AssetFilterOption,
  CameraAspectRatio,
  ClipGroup,
  DEFAULT_CAMERA_ASPECT_RATIO,
  EditorStates,
} from "./enums";
import { MediaItem } from "./models";
import { Simple3DVector } from "./datastructures/common";

export type { Camera, FocalLengthDragging };
export type {
  EasingSpec,
  Keyframe,
  TimelineTrack,
  TimelineData,
  ClipLane,
  ClipStrip,
} from "./engine/timeline/types";
import type { TimelineTrack, ClipLane } from "./engine/timeline/types";

// A still (Capture) or video (Record) produced by Record mode, cached
// locally (object URL) before any upload. Powers the completion modal's
// preview/playback and the 2D/video handoff.
export interface ProducedArtifact {
  kind: "image" | "video";
  blob: Blob;
  objectUrl: string;
  fileName: string;
  mimeType: string;
  aspectRatio: CameraAspectRatio;
}

// Progress of an in-flight Capture/Record so the RenderOverlay can cover the
// viewport (freeing GPU) and show progress while frames encode.
export interface RecordingProgress {
  phase: "capturing" | "encoding" | "uploading";
  pct: number; // 0..1
}

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
  icon: LucideIcon;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  // True for the render-camera placeholder ("::CAM::") — the outliner shows a
  // view-from-camera button for these rows.
  isCamera?: boolean;
  // True when the object contains a SkinnedMesh — the timeline gives it a
  // clip row and animation drags can target it (bind check still applies).
  hasSkeleton?: boolean;
  // Display names of clips baked into the object's own GLB, in index order.
  // Non-empty → the timeline clip row offers a baked-clip picker.
  bakedClips?: string[];
  // Whether the persistent skeleton overlay (outliner bone icon) is on for
  // this object. Mirrors object.userData.skeletonVisible.
  skeletonVisible?: boolean;
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

// See PageSceneState.animationDropState.
export type AnimationDropState = "none" | "checking" | "ok" | "blocked";

export interface PrecisionSelectorCoords {
  x: number;
  y: number;
}

export interface SelectedSceneObject {
  type: AssetType;
  id: string;
}

export type SceneMode = "build" | "record";
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
    // Blender-style default: viewport pulled back + elevated at a 3/4 angle so
    // the whole render-camera frustum (cam2, below) is visible in the scene.
    label: "Main View",
    focalLength: 17,
    position: { x: -4.5, y: 4, z: 6 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0.5, z: 0.6 },
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
  sceneMode: SceneMode;
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
  // True while a Blender-style modal transform (grab/move) is in progress, so
  // free-cam and the normal keymap stand down and let the modal own input.
  modalTransformActive: boolean;

  // timeline (mirrors TimelineController; see engine/editor/TimelineController.ts)
  timelineExists: boolean;
  timelineExpanded: boolean;
  timelinePlayhead: number;
  timelineIsPlaying: boolean;
  timelineDuration: number;
  timelineTracks: TimelineTrack[];
  timelineClipLanes: ClipLane[];
  timelineSelectedKeyframeId: string | null;
  // Selected clip strip (click-to-select). Drives the strip's × visibility
  // and Del/Backspace removal — mirrors keyframe selection.
  timelineSelectedClipLaneId: string | null;
  // Left keyframe of the segment whose easing curve is being edited in the
  // Motion popover (opened from the curve chip BETWEEN two keyframes).
  // Distinct from timelineSelectedKeyframeId, which drives selection/delete.
  timelineEasingKeyframeId: string | null;
  // Leading clip lane whose gap-transition curve is being edited in the
  // Motion popover (opened from the chip in the gap between two strips).
  timelineEasingClipLaneId: string | null;
  // Object whose timeline row should be scrolled into view. Set (with
  // timelineExpanded) after a clip is added; consumed and cleared by an
  // effect in TimelineEditor. A store field because TimelineEditor is
  // unmounted while collapsed, so expand + scroll can't happen in one tick.
  timelineRevealObjectUuid: string | null;
  // Timeline "focus" toggle: show only the selected object's track row.
  // Follows the selection; with nothing selected, all rows show. Store-held
  // (not TimelineEditor state) so it survives the collapse/expand remount.
  timelineFocusSelected: boolean;

  // record output
  producedArtifact: ProducedArtifact | null;
  recordingProgress: RecordingProgress | null;
  // Mutable abort flag for the in-flight encode (recordTimeline polls
  // `cancelled` between frames). Held here so the Escape keybind and the
  // overlay's Cancel button can reach it; null when no encode is running.
  encodeCancelSignal: { cancelled: boolean } | null;

  // layout / panels
  assetModalVisible: boolean;
  // The standalone animations-only library modal ("Add Animation" button).
  // Mutually exclusive with assetModalVisible (see openAnimationsModal /
  // openAssetModal), so at most one library panel is ever open.
  animationsModalVisible: boolean;
  assetModalVisibleDuringDrag: boolean;
  // True while an asset is being dragged out of the library modal. The modal
  // stays open but goes pointer-transparent (and translucent when reopen is on)
  // so the drag passes under it onto the canvas.
  assetDraggingUnder: boolean;
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
  // Live verdict for the animation-clip drag under the cursor, shown as a
  // badge on the drag ghost: "none" (not an animation drag), "checking"
  // (clip still loading), "ok" (target binds the clip), "blocked"
  // (no target, or a rig/bone-name mismatch).
  animationDropState: AnimationDropState;

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
  setSceneMode: (mode: SceneMode) => void;
  setEditorState: (state: EditorStates) => void;
  setTransformMode: (mode: TransformMode) => void;
  setTransformSpace: (space: TransformSpace) => void;
  setSelectedMode: (mode: string) => void;
  setPoseMode: (mode: PoseMode) => void;
  setShowPoseControls: (visible: boolean) => void;
  setGridVisible: (visible: boolean) => void;
  setTimelineExists: (exists: boolean) => void;
  setTimelineExpanded: (expanded: boolean) => void;
  setTimelinePlayhead: (time: number) => void;
  setTimelineIsPlaying: (playing: boolean) => void;
  setTimelineDuration: (duration: number) => void;
  setTimelineTracks: (tracks: TimelineTrack[]) => void;
  setTimelineClipLanes: (clipLanes: ClipLane[]) => void;
  setTimelineSelectedKeyframe: (id: string | null) => void;
  setTimelineSelectedClipLane: (id: string | null) => void;
  setTimelineEasingKeyframe: (id: string | null) => void;
  setTimelineEasingClipLane: (id: string | null) => void;
  setTimelineRevealObjectUuid: (uuid: string | null) => void;
  setTimelineFocusSelected: (focus: boolean) => void;
  setProducedArtifact: (artifact: ProducedArtifact | null) => void;
  clearProducedArtifact: () => void;
  setRecordingProgress: (progress: RecordingProgress | null) => void;
  setEncodeCancelSignal: (signal: { cancelled: boolean } | null) => void;
  // Flip the in-flight encode's abort flag (no-op when nothing is encoding).
  requestEncodeCancel: () => void;
  toggleStats: () => void;
  setIgnoreKeyDelete: (ignore: boolean) => void;
  disableHotkeyInput: (level: DomLevels) => void;
  enableHotkeyInput: (level: DomLevels) => void;
  setIsPromptBoxFocused: (focused: boolean) => void;
  setModalTransformActive: (active: boolean) => void;

  // layout
  setAssetModalVisible: (visible: boolean) => void;
  setAnimationsModalVisible: (visible: boolean) => void;
  setAssetModalVisibleDuringDrag: (visible: boolean) => void;
  setAssetDraggingUnder: (dragging: boolean) => void;
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
  setAnimationDropState: (state: AnimationDropState) => void;

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
  cameraAspectRatio: DEFAULT_CAMERA_ASPECT_RATIO,
  focalLengthDragging: { isDragging: false, focalLength: 35 },
  cameraFilter: AssetFilterOption.ALL,

  editorState: EditorStates.EDIT,
  sceneMode: "build",
  transformMode: "move",
  transformSpace: "world",
  selectedMode: "move",
  poseMode: "select",
  showPoseControls: false,
  gridVisible: true,
  timelineExists: false,
  timelineExpanded: false,
  timelinePlayhead: 0,
  timelineIsPlaying: false,
  timelineDuration: 10,
  timelineTracks: [],
  timelineClipLanes: [],
  timelineSelectedKeyframeId: null,
  timelineSelectedClipLaneId: null,
  timelineEasingKeyframeId: null,
  timelineEasingClipLaneId: null,
  timelineRevealObjectUuid: null,
  timelineFocusSelected: false,
  producedArtifact: null,
  recordingProgress: null,
  encodeCancelSignal: null,
  ignoreKeyDelete: false,
  hotkeyStatus: { disabled: false, disabledBy: DomLevels.NONE },
  isPromptBoxFocused: false,
  modalTransformActive: false,

  assetModalVisible: false,
  animationsModalVisible: false,
  assetModalVisibleDuringDrag: true,
  assetDraggingUnder: false,
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
  animationDropState: "none",

  objectPanelShowing: false,
  objectPanelCurrent: undefined,

  outlinerItems: [],
  outlinerSelectedItem: null,
  outlinerShowing: true,

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
  setSceneMode: (mode) => set({ sceneMode: mode }),
  setEditorState: (state) => set({ editorState: state }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setTransformSpace: (space) => set({ transformSpace: space }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setPoseMode: (mode) => set({ poseMode: mode }),
  setShowPoseControls: (visible) => set({ showPoseControls: visible }),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  setTimelineExists: (exists) => set({ timelineExists: exists }),
  setTimelineExpanded: (expanded) => set({ timelineExpanded: expanded }),
  setTimelinePlayhead: (time) => set({ timelinePlayhead: time }),
  setTimelineIsPlaying: (playing) => set({ timelineIsPlaying: playing }),
  setTimelineDuration: (duration) => set({ timelineDuration: duration }),
  setTimelineTracks: (tracks) => set({ timelineTracks: tracks }),
  setTimelineClipLanes: (clipLanes) => set({ timelineClipLanes: clipLanes }),
  setTimelineSelectedKeyframe: (id) => set({ timelineSelectedKeyframeId: id }),
  setTimelineSelectedClipLane: (id) =>
    set({ timelineSelectedClipLaneId: id }),
  setTimelineEasingKeyframe: (id) => set({ timelineEasingKeyframeId: id }),
  setTimelineEasingClipLane: (id) => set({ timelineEasingClipLaneId: id }),
  setTimelineRevealObjectUuid: (uuid) =>
    set({ timelineRevealObjectUuid: uuid }),
  setTimelineFocusSelected: (focus) => set({ timelineFocusSelected: focus }),
  setProducedArtifact: (artifact) => set({ producedArtifact: artifact }),
  clearProducedArtifact: () =>
    set((s) => {
      if (s.producedArtifact) URL.revokeObjectURL(s.producedArtifact.objectUrl);
      return { producedArtifact: null };
    }),
  setRecordingProgress: (progress) => set({ recordingProgress: progress }),
  setEncodeCancelSignal: (signal) => set({ encodeCancelSignal: signal }),
  requestEncodeCancel: () => {
    const signal = get().encodeCancelSignal;
    if (signal) signal.cancelled = true;
  },
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
  setModalTransformActive: (active) => set({ modalTransformActive: active }),

  // layout actions
  setAssetModalVisible: (visible) => set({ assetModalVisible: visible }),
  setAnimationsModalVisible: (visible) =>
    set({ animationsModalVisible: visible }),
  setAssetModalVisibleDuringDrag: (visible) =>
    set({ assetModalVisibleDuringDrag: visible }),
  setAssetDraggingUnder: (dragging) => set({ assetDraggingUnder: dragging }),
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
  setAnimationDropState: (state) => set({ animationDropState: state }),

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
