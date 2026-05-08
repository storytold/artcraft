// Re-export shim. The Zustand store now lives in
// @storyteller/ui-pagescene; this file exists so importers across
// artcraft (and PageScene's own files still in apps/) can keep their
// existing import paths during the staged lib extraction. Once every
// caller imports from `@storyteller/ui-pagescene` directly, this file
// can be deleted.

export {
  usePageSceneStore,
  DomLevels,
} from "@storyteller/ui-pagescene";
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
} from "@storyteller/ui-pagescene";
