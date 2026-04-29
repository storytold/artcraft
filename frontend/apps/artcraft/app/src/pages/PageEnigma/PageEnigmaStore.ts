import { create } from "zustand";
import { CameraAspectRatio, EditorStates } from "./enums";
import { AssetType, AssetFilterOption, ArtStyle } from "~/enums";
import { styleList } from "./styleList";

export type SceneObjectKind = "object" | "character" | "shape";

export interface SceneObject {
  id: string;
  kind: SceneObjectKind;
  name: string;
  mediaId?: string;
  mediaToken?: string;
}

export interface CameraEntry {
  id: string;
  label: string;
  focalLength: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
}

export interface FocalLengthDragging {
  isDragging: boolean;
  focalLength: number;
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

const DEFAULT_CAMERAS: CameraEntry[] = [
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

interface PageEnigmaState {
  // scene contents
  objects: SceneObject[];
  characters: SceneObject[];
  shapes: SceneObject[];
  selectedObject: SelectedSceneObject | null;

  // cameras
  cameras: CameraEntry[];
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
  sidePanelWidth: number;
  sidePanelVisible: boolean;
  dndSidePanelWidth: number;
  assetModalVisible: boolean;
  assetModalVisibleDuringDrag: boolean;
  reopenAfterDrag: boolean;

  // overlays
  editorLoader: EditorLoader;
  editorLetterBox: boolean;
  previewSrc: string;
  showErrorDialog: boolean;
  errorDialogTitle: string;
  errorDialogMessage: string;

  // movies
  viewMyMovies: boolean;
  generateMovieId: string;

  // generation / stylize
  generateProgress: number;
  selectedArtStyle: ArtStyle;
  upscale: boolean;
  faceDetail: boolean;
  styleStrength: number;
  lipSync: boolean;
  cinematic: boolean;
  enginePreProcessing: boolean;
  globalIPAMediaToken: string | null;
  adapterImage: string | null;
  positivePrompt: string;
  negativePrompt: string;
  isUserInputPositive: boolean;
  isUserInputNegative: boolean;
  showNegativePrompt: boolean;

  // ----- actions -----

  // scene
  addObject: (obj: SceneObject) => void;
  addCharacter: (obj: SceneObject) => void;
  addShape: (obj: SceneObject) => void;
  removeSceneObject: (id: string) => void;
  setSelectedObject: (sel: SelectedSceneObject | null) => void;
  resetScene: () => void;

  // camera
  addCamera: (camera: CameraEntry) => void;
  updateCamera: (id: string, updates: Partial<CameraEntry>) => void;
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
  setIgnoreKeyDelete: (ignore: boolean) => void;
  disableHotkeyInput: (level: DomLevels) => void;
  enableHotkeyInput: (level: DomLevels) => void;
  setIsPromptBoxFocused: (focused: boolean) => void;

  // layout
  setSidePanelWidth: (px: number) => void;
  setSidePanelVisible: (visible: boolean) => void;
  setDndSidePanelWidth: (px: number) => void;
  setAssetModalVisible: (visible: boolean) => void;
  setAssetModalVisibleDuringDrag: (visible: boolean) => void;
  setReopenAfterDrag: (reopen: boolean) => void;

  // overlays
  showEditorLoader: (message?: string) => void;
  hideEditorLoader: () => void;
  toggleEditorLetterBox: (next?: boolean) => void;
  setPreviewSrc: (src: string) => void;
  setErrorDialog: (title: string, message: string) => void;
  setShowErrorDialog: (show: boolean) => void;

  // movies
  setViewMyMovies: (view: boolean) => void;
  setGenerateMovieId: (id: string) => void;

  // generation / stylize
  setGenerateProgress: (n: number) => void;
  setSelectedArtStyle: (style: ArtStyle) => void;
  setUpscale: (v: boolean) => void;
  setFaceDetail: (v: boolean) => void;
  setStyleStrength: (n: number) => void;
  setLipSync: (v: boolean) => void;
  setCinematic: (v: boolean) => void;
  setEnginePreProcessing: (v: boolean) => void;
  setGlobalIPAMediaToken: (t: string | null) => void;
  setAdapterImage: (s: string | null) => void;
  setPositivePrompt: (p: string) => void;
  setNegativePrompt: (p: string) => void;
  setIsUserInputPositive: (v: boolean) => void;
  setIsUserInputNegative: (v: boolean) => void;
  setShowNegativePrompt: (v: boolean) => void;
  resetSceneGenerationMetadata: () => void;
}

export const usePageEnigmaStore = create<PageEnigmaState>((set, get) => ({
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

  sidePanelWidth: 0,
  sidePanelVisible: false,
  dndSidePanelWidth: -1,
  assetModalVisible: false,
  assetModalVisibleDuringDrag: true,
  reopenAfterDrag: false,

  editorLoader: { isShowing: false, message: "Loading Editor Engine 🦊" },
  editorLetterBox: true,
  previewSrc: "",
  showErrorDialog: false,
  errorDialogTitle: "Error!",
  errorDialogMessage: "Something went wrong.",

  viewMyMovies: false,
  generateMovieId: "",

  generateProgress: -1,
  selectedArtStyle: styleList[0].type,
  upscale: false,
  faceDetail: true,
  styleStrength: 0.8,
  lipSync: false,
  cinematic: true,
  enginePreProcessing: false,
  globalIPAMediaToken: null,
  adapterImage: null,
  positivePrompt: "",
  negativePrompt: "",
  isUserInputPositive: false,
  isUserInputNegative: false,
  showNegativePrompt: false,

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
  setSidePanelWidth: (px) => set({ sidePanelWidth: px }),
  setSidePanelVisible: (visible) => set({ sidePanelVisible: visible }),
  setDndSidePanelWidth: (px) => set({ dndSidePanelWidth: px }),
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
  setPreviewSrc: (src) => set({ previewSrc: src }),
  setErrorDialog: (title, message) =>
    set({
      errorDialogTitle: title,
      errorDialogMessage: message,
      showErrorDialog: true,
    }),
  setShowErrorDialog: (show) => set({ showErrorDialog: show }),

  // movies actions
  setViewMyMovies: (view) => set({ viewMyMovies: view }),
  setGenerateMovieId: (id) => set({ generateMovieId: id }),

  // generation / stylize actions
  setGenerateProgress: (n) => set({ generateProgress: n }),
  setSelectedArtStyle: (style) => set({ selectedArtStyle: style }),
  setUpscale: (v) => set({ upscale: v }),
  setFaceDetail: (v) => set({ faceDetail: v }),
  setStyleStrength: (n) => set({ styleStrength: n }),
  setLipSync: (v) => set({ lipSync: v }),
  setCinematic: (v) => set({ cinematic: v }),
  setEnginePreProcessing: (v) => set({ enginePreProcessing: v }),
  setGlobalIPAMediaToken: (t) => set({ globalIPAMediaToken: t }),
  setAdapterImage: (s) => set({ adapterImage: s }),
  setPositivePrompt: (p) => set({ positivePrompt: p }),
  setNegativePrompt: (p) => set({ negativePrompt: p }),
  setIsUserInputPositive: (v) => set({ isUserInputPositive: v }),
  setIsUserInputNegative: (v) => set({ isUserInputNegative: v }),
  setShowNegativePrompt: (v) => set({ showNegativePrompt: v }),
  resetSceneGenerationMetadata: () =>
    set({
      positivePrompt: "",
      negativePrompt: "",
      isUserInputPositive: false,
      isUserInputNegative: false,
      showNegativePrompt: false,
      selectedArtStyle: styleList[0].type,
      upscale: false,
      faceDetail: false,
      styleStrength: 0.8,
      lipSync: false,
      cinematic: false,
      enginePreProcessing: false,
    }),
}));
