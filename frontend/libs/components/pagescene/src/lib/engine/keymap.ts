import {
  ACTIONS,
  useKeybindsStore,
  type ActionId,
  type Binding,
  type KeybindContext,
  type KeyGroup as KeybindsKeyGroup,
} from "@storyteller/keybinds";
import type Editor from "./editor";
import { CreateAction } from "./editor/actions/CreateAction";
import {
  AssetModalVisibilityChangedEvent,
  PoseControlsVisibilityChangedEvent,
  SelectedModeChangedEvent,
  TransformModeChangedEvent,
} from "./events/EngineEvent";
import { usePageSceneStore, type PoseMode } from "../PageSceneStore";
import {
  addKeyframe,
  deleteKeyframe,
  nudgeClipLane,
  nudgeKeyframe,
  pauseTimeline,
  playTimeline,
  removeClipLane,
  seekTimeline,
} from "../actions/timeline";
import { captureStill, recordVideo } from "../actions/recordOutput";

// One declarative table mapping viewport actions to their handlers. The actual
// key bindings now come from the unified @storyteller/keybinds registry (preset
// + per-user overrides), so this file owns *what each action does*, not *which
// key triggers it*. useViewportKeyboard dispatches against the resolved list;
// the cheatsheet overlay renders the same registry.

export type KeyGroup = KeybindsKeyGroup;

export interface KeyBinding {
  code: string; // matches event.code (e.g. "KeyT", "Backspace")
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean };
  label: string;
  group: KeyGroup;
  run: (editor: Editor) => void | Promise<void>;
  // Whether the binding should preventDefault + stopPropagation when
  // matched. Used for browser shortcut conflicts (Ctrl+Z, Ctrl+C, etc).
  preventDefault?: boolean;
  // Availability gate from the registry ActionDef. Absent = the default
  // rule (available unless an encode is running).
  when?: (ctx: KeybindContext) => boolean;
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
  // Escape leaves camera view first (before touching pose/selection).
  if (editor.cameraController.getCameraPersonMode()) {
    editor.cameraController.exitCameraView();
    return;
  }
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

const deselectAll = (editor: Editor) => {
  const mc = editor.mouse_controls;
  if (!mc?.selected?.length) return;
  mc.removeTransformControls();
  mc.selected = [];
  editor.bus.emit(new PoseControlsVisibilityChangedEvent(false));
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

// ── timeline / record handlers ───────────────────────────────────────────────
// Availability (which contexts these fire in) lives on the registry defs;
// handlers only implement the action itself.

const timelinePlayPause = (editor: Editor) => {
  if (usePageSceneStore.getState().timelineIsPlaying) pauseTimeline(editor);
  else playTimeline(editor);
};

const timelineStep = (editor: Editor, direction: 1 | -1) => {
  const timeline = editor.timelineController.getTimeline();
  if (!timeline) return;
  const fps = timeline.fps || 30;
  const next =
    editor.timelineController.getPlayhead() + direction / fps;
  seekTimeline(editor, Math.min(timeline.duration, Math.max(0, next)));
};

// Move the selected keyframe (or clip strip) one frame in time. The registry
// gates this on a valid selection; the id lookups below are just resolution,
// not availability checks.
const timelineNudge = (editor: Editor, direction: 1 | -1) => {
  const store = usePageSceneStore.getState();
  const timeline = editor.timelineController.getTimeline();
  if (!timeline) return;
  const delta = direction / (timeline.fps || 30);
  const keyframeId = store.timelineSelectedKeyframeId;
  if (keyframeId) {
    for (const track of timeline.tracks) {
      const keyframe = track.keyframes.find((k) => k.id === keyframeId);
      if (keyframe) {
        const time = Math.min(
          timeline.duration,
          Math.max(0, keyframe.time + delta),
        );
        nudgeKeyframe(editor, keyframeId, time);
        return;
      }
    }
    return;
  }
  const laneId = store.timelineSelectedClipLaneId;
  if (!laneId) return;
  const lane = editor.timelineController.getClipLane(laneId);
  if (!lane) return;
  nudgeClipLane(editor, laneId, Math.max(0, lane.strip.startTime + delta));
};

const timelineAddKeyframe = (editor: Editor) => {
  const uuid = editor.mouse_controls?.selected?.[0]?.uuid;
  if (!uuid) return;
  addKeyframe(editor, uuid);
};

// Registry-gated complement of deleteSelected (scene object): fires only for
// a VALID keyframe/strip selection, so a stale id can never eat the key. The
// selection is re-resolved here in case it changed since the ctx snapshot.
const timelineDeleteSelected = (editor: Editor) => {
  const store = usePageSceneStore.getState();
  const keyframeId = store.timelineSelectedKeyframeId;
  if (keyframeId) {
    const exists = editor.timelineController
      .getTimeline()
      ?.tracks.some((t) => t.keyframes.some((k) => k.id === keyframeId));
    if (exists) deleteKeyframe(editor, keyframeId);
    store.setTimelineSelectedKeyframe(null);
    return;
  }
  const laneId = store.timelineSelectedClipLaneId;
  if (!laneId) return;
  if (editor.timelineController.getClipLane(laneId)) {
    removeClipLane(editor, laneId);
  }
  store.setTimelineSelectedClipLane(null);
};

// Action id → handler. Bindings live in the keybinds registry; this maps each
// registered PageScene action to what it actually does.
const HANDLERS: Record<ActionId, (editor: Editor) => void | Promise<void>> = {
  "pagescene.transform.grab": (e) => e.beginModalTransform("translate"),
  "pagescene.transform.translate": (e) => setGizmoMode(e, "translate", "move"),
  "pagescene.transform.rotate": (e) => setGizmoMode(e, "rotate", "rotate"),
  "pagescene.transform.scale": (e) => setGizmoMode(e, "scale", "scale"),
  "pagescene.transform.toggleSpace": (e) => e.gizmo.toggleTransformSpace(),
  "pagescene.transform.poseFK": (e) => e.mouse_controls?.toggleFKMode(),
  "pagescene.view.focus": focusSelected,
  "pagescene.view.assetMenu": openAssetModal,
  "pagescene.view.toggleCameraView": toggleCameraView,
  "pagescene.view.toggleStats": toggleStats,
  "pagescene.selection.clearOrExit": onEscape,
  "pagescene.selection.deselectAll": deselectAll,
  "pagescene.edit.delete": deleteSelected,
  "pagescene.edit.duplicate": (e) => e.duplicateSelected(),
  "pagescene.edit.toggleSnapping": (e) => e.toggleSnapping(),
  "pagescene.view.toggleGrid": (e) => e.toggleGrid(),
  "pagescene.edit.undo": undo,
  "pagescene.edit.redo": redo,
  "pagescene.edit.copy": copy,
  "pagescene.edit.paste": paste,
  "pagescene.timeline.playPause": timelinePlayPause,
  "pagescene.timeline.stepBack": (e) => timelineStep(e, -1),
  "pagescene.timeline.stepForward": (e) => timelineStep(e, 1),
  "pagescene.timeline.nudgeLeft": (e) => timelineNudge(e, -1),
  "pagescene.timeline.nudgeRight": (e) => timelineNudge(e, 1),
  "pagescene.timeline.goToStart": (e) => seekTimeline(e, 0),
  "pagescene.timeline.goToEnd": (e) => {
    const timeline = e.timelineController.getTimeline();
    if (timeline) seekTimeline(e, timeline.duration);
  },
  "pagescene.timeline.addKeyframe": timelineAddKeyframe,
  "pagescene.timeline.deleteSelected": timelineDeleteSelected,
  "pagescene.timeline.toggleExpanded": () => {
    const store = usePageSceneStore.getState();
    store.setTimelineExpanded(!store.timelineExpanded);
  },
  "pagescene.record.toggleMode": () => {
    const store = usePageSceneStore.getState();
    store.setSceneMode(store.sceneMode === "record" ? "build" : "record");
  },
  "pagescene.record.captureStill": captureStill,
  "pagescene.record.recordVideo": recordVideo,
  "pagescene.record.cancelEncode": () =>
    usePageSceneStore.getState().requestEncodeCancel(),
};

// Expand the handler table into concrete KeyBindings using the resolved bindings
// for each action (one KeyBinding per bound key — so Delete+Backspace and the
// two Redo combos each stay live). `forAction` defaults to the store so non-React
// callers keep working; useViewportKeyboard passes a reactive resolver.
export const buildKeymap = (
  forAction: (id: ActionId) => Binding[] = (id) =>
    useKeybindsStore.getState().resolveBindings(id),
): KeyBinding[] => {
  const out: KeyBinding[] = [];
  for (const [id, run] of Object.entries(HANDLERS)) {
    const def = ACTIONS[id];
    if (!def) continue;
    for (const binding of forAction(id)) {
      out.push({
        code: binding.code,
        modifiers: { ctrl: binding.ctrl, shift: binding.shift, alt: binding.alt },
        label: def.label,
        group: def.group,
        run,
        preventDefault: def.preventDefault,
        when: def.when,
      });
    }
  }
  return out;
};

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

// Availability: an action's `when` predicate has full control; without one,
// the default rule is "available unless an encode is running". An unavailable
// binding is skipped WITHOUT consuming the event, so the same key can serve
// different actions in different contexts (e.g. Space = camera toggle in
// build, playback in the timeline) and unrelated listeners still see the key.
export const dispatchBinding = (
  bindings: KeyBinding[],
  event: KeyboardEvent,
  editor: Editor,
  ctx: KeybindContext = {},
): boolean => {
  for (const binding of bindings) {
    if (!matches(binding, event)) continue;
    const available = binding.when ? binding.when(ctx) : !ctx.encoding;
    if (!available) continue;
    if (binding.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
    void binding.run(editor);
    return true;
  }
  return false;
};
