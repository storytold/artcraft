import { ActionDef, ActionId, Surface } from "./types";

// The registry is the single source of truth for every remappable action.
// Presets and overrides supply bindings keyed by these ids; engine hooks resolve
// handlers by id. Video-editor keeps its own separate system and is NOT here.
//
// Grows per phase: this set covers the 3D PageScene's existing operations.
// New 3D binds (duplicate, select-all, grid/snapping, modal axis-lock) and the
// 2D/moodboard surfaces are added as their wiring lands.

const defs: ActionDef[] = [
  // ── PageScene: camera (continuous, held) ──────────────────────────────────
  cam("pagescene.camera.forward", "Camera forward"),
  cam("pagescene.camera.back", "Camera back"),
  cam("pagescene.camera.left", "Camera left"),
  cam("pagescene.camera.right", "Camera right"),
  cam("pagescene.camera.up", "Camera up"),
  cam("pagescene.camera.down", "Camera down"),
  cam("pagescene.camera.pitchUp", "Look up"),
  cam("pagescene.camera.pitchDown", "Look down"),
  cam("pagescene.camera.yawLeft", "Look left"),
  cam("pagescene.camera.yawRight", "Look right"),

  // ── PageScene: transform ──────────────────────────────────────────────────
  act("pagescene.transform.translate", "Move (translate)", "Transform", { important: true }),
  act("pagescene.transform.rotate", "Rotate", "Transform", { important: true }),
  act("pagescene.transform.scale", "Scale", "Transform", { important: true }),
  act("pagescene.transform.toggleSpace", "Toggle local / world", "Transform"),
  act("pagescene.transform.poseFK", "Toggle pose (FK)", "Transform"),

  // ── PageScene: view ───────────────────────────────────────────────────────
  act("pagescene.view.focus", "Focus selection", "View", { important: true }),
  act("pagescene.view.assetMenu", "Open asset menu", "View", { important: true }),
  act("pagescene.view.toggleCameraView", "Toggle camera view", "View", {
    important: true,
    preventDefault: true,
  }),
  act("pagescene.view.toggleStats", "Toggle perf stats", "View"),

  // ── PageScene: selection ──────────────────────────────────────────────────
  act("pagescene.selection.clearOrExit", "Clear selection / exit pose", "Selection", {
    important: true,
  }),

  // ── PageScene: edit ───────────────────────────────────────────────────────
  act("pagescene.edit.delete", "Delete selected", "Edit", { important: true }),
  act("pagescene.edit.undo", "Undo", "History", { important: true, preventDefault: true }),
  act("pagescene.edit.redo", "Redo", "History", { important: true, preventDefault: true }),
  act("pagescene.edit.copy", "Copy", "Edit", { preventDefault: true }),
  act("pagescene.edit.paste", "Paste", "Edit", { preventDefault: true }),
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

// ── builders ─────────────────────────────────────────────────────────────────

function act(
  id: ActionId,
  label: string,
  group: ActionDef["group"],
  extra: Partial<ActionDef> = {},
): ActionDef {
  return { id, label, group, surface: surfaceOf(id), ...extra };
}

function cam(id: ActionId, label: string): ActionDef {
  return { id, label, group: "Camera", surface: "pagescene", continuous: true };
}

function surfaceOf(id: ActionId): Surface {
  const head = id.split(".")[0];
  if (head === "pagedraw") return "pagedraw";
  if (head === "moodboard") return "moodboard";
  return "pagescene";
}
