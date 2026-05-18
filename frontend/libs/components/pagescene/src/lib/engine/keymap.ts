import type Editor from "./editor";
import { CreateAction } from "./editor/actions/CreateAction";
import {
  AssetModalVisibilityChangedEvent,
  PoseControlsVisibilityChangedEvent,
  SelectedModeChangedEvent,
  TransformModeChangedEvent,
} from "./events/EngineEvent";
import type { PoseMode } from "../PageSceneStore";

// One declarative table for every viewport keyboard shortcut.
// useViewportKeyboard dispatches against this list; a future Ctrl-hold
// cheatsheet overlay can render the same data without duplication.

export type KeyGroup = "Transform" | "Selection" | "Edit" | "View";

export interface KeyBinding {
  code: string; // matches event.code (e.g. "KeyT", "Backspace")
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean };
  label: string;
  group: KeyGroup;
  run: (editor: Editor) => void | Promise<void>;
  // Whether the binding should preventDefault + stopPropagation when
  // matched. Used for browser shortcut conflicts (Ctrl+Z, Ctrl+C, etc).
  preventDefault?: boolean;
}

// The TransformControls gizmo uses "translate" / "rotate" / "scale";
// the store's TransformMode union uses "move" / "rotate" / "scale".
// Keep the gizmo and store both in sync from one place.
const setGizmoMode = (
  editor: Editor,
  gizmoMode: "translate" | "rotate" | "scale",
  storeMode: "move" | "rotate" | "scale",
) => {
  editor.gizmo.changeMode(gizmoMode);
  editor.bus.emit(new TransformModeChangedEvent(storeMode));
  editor.bus.emit(new SelectedModeChangedEvent(storeMode));
};

const deleteSelected = (editor: Editor) => {
  const mc = editor.mouse_controls;
  if (!mc?.selected) return;
  // Route through editor.deleteObject so HistoryManager records the
  // deletion. mc.deleteObject (the legacy direct path) bypasses history.
  mc.selected.forEach((sel) => {
    editor.deleteObject(sel.uuid);
  });
  mc.selected = [];
  mc.removeTransformControls();
  editor.bus.emit(new PoseControlsVisibilityChangedEvent(false));
};

const onEscape = (editor: Editor) => {
  const poseMode: PoseMode = editor.getPoseMode();
  if (poseMode === "pose") {
    editor.mouse_controls?.toggleFKMode();
    return;
  }
  if (editor.mouse_controls?.selected?.length) {
    editor.mouse_controls.removeTransformControls();
    editor.bus.emit(new PoseControlsVisibilityChangedEvent(false));
  }
};

const focusSelected = (editor: Editor) => {
  if (
    editor.mouse_controls?.selected?.length &&
    editor.mouse_controls.lockControls
  ) {
    editor.mouse_controls.focus();
  }
};

const openAssetModal = (editor: Editor) => {
  editor.bus.emit(new AssetModalVisibilityChangedEvent(true, true));
};

const toggleCameraView = (editor: Editor) => {
  editor.cameraController.switchCameraView();
};

const undo = async (editor: Editor) => {
  await editor.history.undo();
};

const redo = async (editor: Editor) => {
  await editor.history.redo();
};

const copy = async (editor: Editor) => {
  await editor.sceneManager?.copy();
};

const paste = async (editor: Editor) => {
  const obj = await editor.sceneManager?.paste();
  if (!obj) return;
  editor.history.record(new CreateAction(editor, obj));
  editor.selection.refreshOutliner();
};

const toggleStats = (editor: Editor) => {
  editor.toggle_stats();
};

export const buildKeymap = (): KeyBinding[] => [
  // Transform
  { code: "KeyT", label: "Translate", group: "Transform",
    run: (e) => setGizmoMode(e, "translate", "move") },
  { code: "KeyR", label: "Rotate", group: "Transform",
    run: (e) => setGizmoMode(e, "rotate", "rotate") },
  { code: "KeyG", label: "Scale", group: "Transform",
    run: (e) => setGizmoMode(e, "scale", "scale") },
  { code: "KeyX", label: "Toggle local/world", group: "Transform",
    run: (e) => e.gizmo.toggleTransformSpace() },
  { code: "KeyK", label: "Toggle pose (FK)", group: "Transform",
    run: (e) => e.mouse_controls?.toggleFKMode() },

  // Selection / view
  { code: "KeyF", label: "Focus selection", group: "View",
    run: focusSelected },
  { code: "KeyB", label: "Open asset menu", group: "View",
    run: openAssetModal },
  { code: "Space", label: "Toggle camera view", group: "View",
    run: toggleCameraView, preventDefault: true },
  { code: "Escape", label: "Clear selection / exit pose", group: "Selection",
    run: onEscape },
  { code: "Backquote", label: "Toggle perf stats", group: "View",
    run: toggleStats },

  // Edit
  { code: "Backspace", label: "Delete selected", group: "Edit",
    run: deleteSelected },
  { code: "Delete", label: "Delete selected", group: "Edit",
    run: deleteSelected },
  { code: "KeyZ", modifiers: { ctrl: true }, label: "Undo", group: "Edit",
    run: undo, preventDefault: true },
  { code: "KeyZ", modifiers: { ctrl: true, shift: true }, label: "Redo",
    group: "Edit", run: redo, preventDefault: true },
  { code: "KeyY", modifiers: { ctrl: true }, label: "Redo", group: "Edit",
    run: redo, preventDefault: true },
  { code: "KeyC", modifiers: { ctrl: true }, label: "Copy", group: "Edit",
    run: copy, preventDefault: true },
  { code: "KeyV", modifiers: { ctrl: true }, label: "Paste", group: "Edit",
    run: paste, preventDefault: true },
];

const matches = (binding: KeyBinding, e: KeyboardEvent): boolean => {
  if (binding.code !== e.code) return false;
  const m = binding.modifiers ?? {};
  // Treat Ctrl and Meta interchangeably so macOS Cmd+X works too.
  const ctrlOrMeta = e.ctrlKey || e.metaKey;
  if (!!m.ctrl !== !!ctrlOrMeta) return false;
  if (!!m.shift !== !!e.shiftKey) return false;
  if (!!m.alt !== !!e.altKey) return false;
  return true;
};

export const dispatchBinding = (
  bindings: KeyBinding[],
  event: KeyboardEvent,
  editor: Editor,
): boolean => {
  for (const binding of bindings) {
    if (!matches(binding, event)) continue;
    if (binding.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
    void binding.run(editor);
    return true;
  }
  return false;
};
