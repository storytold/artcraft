import { ActionDef, ActionId, KeybindContext, Surface } from "./types";

// The registry is the single source of truth for every remappable action.
// Presets and overrides supply bindings keyed by these ids; engine hooks resolve
// handlers by id. Video-editor keeps its own separate system and is NOT here.
//
// Grows per phase: this set covers the 3D PageScene's existing operations.
// New 3D binds (duplicate, select-all, grid/snapping, modal axis-lock) and the
// 2D/moodboard surfaces are added as their wiring lands.

// Record mode is immutable: every action that edits the scene, moves the
// camera intentionally, or opens build chrome is gated to build mode. View
// toggles that merely change what the viewport shows (camera view, grid,
// stats) stay live in record — the encode always renders through the render
// camera regardless of the viewport view.
const inBuild = (ctx: KeybindContext) =>
  ctx.sceneMode !== "record" && !ctx.encoding;

// Camera-look arrows yield to the timeline while it's open (arrows mean
// frame stepping / keyframe nudging there); camera MOVE keys stay live so
// shots can still be framed with the timeline expanded. useFreeCam enforces
// these same rules imperatively — keep the two in sync.
const cameraMove = inBuild;
const cameraLook = (ctx: KeybindContext) =>
  inBuild(ctx) && !ctx.timelineExpanded;

// Timeline transport is live wherever playback exists: the expanded editor
// in build mode, and all of record mode (read-only playback bar).
const inPlayback = (ctx: KeybindContext) =>
  !ctx.encoding && (!!ctx.timelineExpanded || ctx.sceneMode === "record");

const defs: ActionDef[] = [
  // ── PageScene: camera (continuous, held) ──────────────────────────────────
  cam("pagescene.camera.forward", "Camera forward", cameraMove),
  cam("pagescene.camera.back", "Camera back", cameraMove),
  cam("pagescene.camera.left", "Camera left", cameraMove),
  cam("pagescene.camera.right", "Camera right", cameraMove),
  cam("pagescene.camera.up", "Camera up", cameraMove),
  cam("pagescene.camera.down", "Camera down", cameraMove),
  cam("pagescene.camera.pitchUp", "Look up", cameraLook),
  cam("pagescene.camera.pitchDown", "Look down", cameraLook),
  cam("pagescene.camera.yawLeft", "Look left", cameraLook),
  cam("pagescene.camera.yawRight", "Look right", cameraLook),

  // ── PageScene: transform ──────────────────────────────────────────────────
  act("pagescene.transform.grab", "Grab / move (modal)", "Transform", { important: true, when: inBuild }),
  act("pagescene.transform.translate", "Move (translate)", "Transform", { important: true, when: inBuild }),
  act("pagescene.transform.rotate", "Rotate", "Transform", { important: true, when: inBuild }),
  act("pagescene.transform.scale", "Scale", "Transform", { important: true, when: inBuild }),
  act("pagescene.transform.toggleSpace", "Toggle local / world", "Transform", { when: inBuild }),
  act("pagescene.transform.poseFK", "Toggle pose (FK)", "Transform", { when: inBuild }),

  // ── PageScene: view ───────────────────────────────────────────────────────
  act("pagescene.view.focus", "Focus selection", "View", { important: true, when: inBuild }),
  act("pagescene.view.assetMenu", "Open asset menu", "View", { important: true, when: inBuild }),
  act("pagescene.view.toggleCameraView", "Toggle camera view", "View", {
    important: true,
    preventDefault: true,
    // Space belongs to timeline playback whenever playback UI is up (the
    // expanded editor, or all of record mode) — the camera toggle takes the
    // complement. In record mode, view peeking is double-click only.
    when: (ctx) => !inPlayback(ctx) && !ctx.encoding,
  }),
  act("pagescene.view.toggleStats", "Toggle perf stats", "View"),

  // ── PageScene: selection ──────────────────────────────────────────────────
  act("pagescene.selection.clearOrExit", "Clear selection / exit pose", "Selection", {
    important: true,
  }),
  act("pagescene.selection.deselectAll", "Deselect all", "Selection", { when: inBuild }),

  // ── PageScene: edit ───────────────────────────────────────────────────────
  // Scene-object delete owns Del/Backspace EXCEPT when the expanded timeline
  // holds a valid keyframe/strip selection — then timeline.deleteSelected
  // takes the key. The two predicates are exact complements; consumption
  // order is decided here, not by listener phase or registration order.
  act("pagescene.edit.delete", "Delete selected", "Edit", {
    important: true,
    when: (ctx) =>
      inBuild(ctx) && !(ctx.timelineExpanded && ctx.timelineSelection),
  }),
  act("pagescene.edit.duplicate", "Duplicate selected", "Edit", { important: true, when: inBuild }),
  act("pagescene.edit.toggleSnapping", "Toggle grid snapping", "Edit", { when: inBuild }),
  act("pagescene.view.toggleGrid", "Toggle grid", "View"),
  act("pagescene.edit.undo", "Undo", "History", { important: true, preventDefault: true, when: inBuild }),
  act("pagescene.edit.redo", "Redo", "History", { important: true, preventDefault: true, when: inBuild }),
  act("pagescene.edit.copy", "Copy", "Edit", { preventDefault: true, when: inBuild }),
  act("pagescene.edit.paste", "Paste", "Edit", { preventDefault: true, when: inBuild }),

  // ── PageScene: timeline ───────────────────────────────────────────────────
  // Transport works wherever playback exists (expanded editor, record mode).
  // Arrows are context-split: a valid keyframe/strip selection makes them
  // NUDGE the selection; otherwise they STEP the playhead — complements, so
  // sharing ←/→ is deliberate, not a conflict.
  act("pagescene.timeline.playPause", "Play / pause", "Timeline", {
    important: true,
    preventDefault: true,
    when: inPlayback,
  }),
  act("pagescene.timeline.stepBack", "Step one frame back", "Timeline", {
    preventDefault: true,
    when: (ctx) => inPlayback(ctx) && !ctx.timelineSelection,
  }),
  act("pagescene.timeline.stepForward", "Step one frame forward", "Timeline", {
    preventDefault: true,
    when: (ctx) => inPlayback(ctx) && !ctx.timelineSelection,
  }),
  act("pagescene.timeline.nudgeLeft", "Nudge selection back", "Timeline", {
    preventDefault: true,
    when: (ctx) =>
      inBuild(ctx) && !!ctx.timelineExpanded && !!ctx.timelineSelection,
  }),
  act("pagescene.timeline.nudgeRight", "Nudge selection forward", "Timeline", {
    preventDefault: true,
    when: (ctx) =>
      inBuild(ctx) && !!ctx.timelineExpanded && !!ctx.timelineSelection,
  }),
  act("pagescene.timeline.goToStart", "Go to start", "Timeline", {
    preventDefault: true,
    when: inPlayback,
  }),
  act("pagescene.timeline.goToEnd", "Go to end", "Timeline", {
    preventDefault: true,
    when: inPlayback,
  }),
  act("pagescene.timeline.addKeyframe", "Add keyframe (selected object)", "Timeline", {
    important: true,
    when: (ctx) => inBuild(ctx) && !!ctx.timelineExpanded,
  }),
  // Exact complement of pagescene.edit.delete (see its note above).
  act("pagescene.timeline.deleteSelected", "Delete keyframe / clip", "Timeline", {
    preventDefault: true,
    when: (ctx) =>
      inBuild(ctx) && !!ctx.timelineExpanded && !!ctx.timelineSelection,
  }),
  act("pagescene.timeline.toggleExpanded", "Expand / collapse timeline", "Timeline", {
    when: inBuild,
  }),

  // ── PageScene: record ─────────────────────────────────────────────────────
  act("pagescene.record.toggleMode", "Toggle build / record mode", "Record", {
    important: true,
    preventDefault: true,
    when: (ctx) => !ctx.encoding,
  }),
  act("pagescene.record.captureStill", "Capture still", "Record", {
    preventDefault: true,
    when: (ctx) => ctx.sceneMode === "record" && !ctx.encoding,
  }),
  act("pagescene.record.recordVideo", "Record timeline to video", "Record", {
    preventDefault: true,
    when: (ctx) => ctx.sceneMode === "record" && !ctx.encoding,
  }),
  // Live ONLY mid-encode — the one action allowed through while rendering.
  act("pagescene.record.cancelEncode", "Cancel render", "Record", {
    when: (ctx) => !!ctx.encoding,
  }),

  // ── PageDraw (2D editor) ──────────────────────────────────────────────────
  // Tool switching mirrors the SideToolbar's visual order; the toolbar shows
  // each tool's resolved key as a corner badge. Size up/down adjusts whichever
  // size the active tool uses (brush/eraser share one, mask has its own).
  act("pagedraw.tools.select", "Select tool", "Tools", { important: true }),
  // Not a single tool — first press activates, pressing again cycles the
  // rectangle/circle/triangle submenu (Adobe/Figma same-key convention).
  act("pagedraw.tools.shape", "Shape tool (cycle shapes)", "Tools", {
    important: true,
  }),
  act("pagedraw.tools.brush", "Brush tool", "Tools", { important: true }),
  act("pagedraw.tools.mask", "Mask tool", "Tools", { important: true }),
  act("pagedraw.tools.eraser", "Eraser tool", "Tools", { important: true }),
  act("pagedraw.tools.brushSizeUp", "Increase brush size", "Tools", {
    preventDefault: true, // Ctrl+= is browser zoom
  }),
  act("pagedraw.tools.brushSizeDown", "Decrease brush size", "Tools", {
    preventDefault: true, // Ctrl+- is browser zoom
  }),
  act("pagedraw.edit.delete", "Delete selected", "Edit", { important: true }),
  act("pagedraw.edit.copy", "Copy", "Edit", { important: true, preventDefault: true }),
  act("pagedraw.edit.paste", "Paste", "Edit", { important: true, preventDefault: true }),
  act("pagedraw.history.undo", "Undo", "History", { important: true, preventDefault: true }),
  act("pagedraw.history.redo", "Redo", "History", { important: true, preventDefault: true }),

  // ── Moodboard ─────────────────────────────────────────────────────────────
  act("moodboard.tools.select", "Select tool", "Tools", { important: true }),
  act("moodboard.tools.lasso", "Lasso tool", "Tools", { important: true }),
  act("moodboard.tools.text", "Text tool", "Tools", { important: true }),
  act("moodboard.selection.selectAll", "Select all", "Selection", {
    important: true,
    preventDefault: true,
  }),
  act("moodboard.selection.clear", "Clear selection", "Selection", { important: true }),
  act("moodboard.edit.delete", "Delete selection", "Edit", { important: true }),
  act("moodboard.edit.group", "Group selection", "Edit", {
    important: true,
    preventDefault: true,
  }),
  act("moodboard.edit.ungroup", "Ungroup selection", "Edit", {
    important: true,
    preventDefault: true,
  }),
  act("moodboard.view.fitToContent", "Zoom to fit", "View", {
    important: true,
    preventDefault: true,
  }),
  act("moodboard.history.undo", "Undo", "History", { important: true, preventDefault: true }),
  act("moodboard.history.redo", "Redo", "History", { important: true, preventDefault: true }),
];

export const ACTIONS: Record<ActionId, ActionDef> = Object.fromEntries(
  defs.map((d) => [d.id, d]),
);

export const ACTIONS_BY_SURFACE: Record<Surface, ActionDef[]> = {
  pagescene: defs.filter((d) => d.surface === "pagescene"),
  pagedraw: defs.filter((d) => d.surface === "pagedraw"),
  moodboard: defs.filter((d) => d.surface === "moodboard"),
};

export function getAction(id: ActionId): ActionDef | undefined {
  return ACTIONS[id];
}

// ── availability ─────────────────────────────────────────────────────────────

/** The dispatch-time availability rule: `when` has full control; without one,
 *  an action is available unless an encode is running. */
export function actionAvailable(def: ActionDef, ctx: KeybindContext): boolean {
  return def.when ? def.when(ctx) : !ctx.encoding;
}

// Representative context grid for co-availability checks. Covers every field
// the registry's `when` gates read — extend it when a new KeybindContext
// field gains a gate, or exclusivity checks will silently miss it.
const SAMPLE_CONTEXTS: KeybindContext[] = (["build", "record"] as const).flatMap(
  (sceneMode) =>
    [false, true].flatMap((encoding) =>
      [false, true].flatMap((timelineExpanded) =>
        [false, true].map((timelineSelection) => ({
          sceneMode,
          encoding,
          timelineExpanded,
          timelineSelection,
        })),
      ),
    ),
);

/** Whether two actions can ever be live in the same context. Actions that are
 *  context-exclusive (e.g. cancel-render vs clear-selection, both Escape) may
 *  deliberately share a binding — the dispatcher picks whichever is available. */
export function actionsCoAvailable(a: ActionDef, b: ActionDef): boolean {
  return SAMPLE_CONTEXTS.some(
    (ctx) => actionAvailable(a, ctx) && actionAvailable(b, ctx),
  );
}

// ── builders ─────────────────────────────────────────────────────────────────

function act(
  id: ActionId,
  label: string,
  group: ActionDef["group"],
  extra: Partial<ActionDef> = {},
): ActionDef {
  return { id, label, group, surface: surfaceOf(id), ...extra };
}

function cam(
  id: ActionId,
  label: string,
  when?: (ctx: KeybindContext) => boolean,
): ActionDef {
  return {
    id,
    label,
    group: "Camera",
    surface: "pagescene",
    continuous: true,
    important: true,
    when,
  };
}

function surfaceOf(id: ActionId): Surface {
  const head = id.split(".")[0];
  if (head === "pagedraw") return "pagedraw";
  if (head === "moodboard") return "moodboard";
  return "pagescene";
}
