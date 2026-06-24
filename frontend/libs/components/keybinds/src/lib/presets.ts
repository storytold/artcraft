import { ActionId, Binding, Preset, PresetId } from "./types";

// BASE_BINDINGS is the "Gamer" scheme — it MUST reproduce the app's current
// hardcoded bindings exactly so adopting the system changes nothing by default.
// Presets list only the actions that DIFFER from BASE (3D-only deltas); every
// other action falls through to BASE regardless of selected preset, so 2D and
// moodboard are unaffected by preset choice.

const b = (code: string, mods: Omit<Binding, "code"> = {}): Binding => ({ code, ...mods });

export const BASE_BINDINGS: Record<ActionId, Binding[]> = {
  // Camera (held) — WASD + QE + arrows, matching cameraMath.ts today.
  "pagescene.camera.forward": [b("KeyW")],
  "pagescene.camera.back": [b("KeyS")],
  "pagescene.camera.left": [b("KeyA")],
  "pagescene.camera.right": [b("KeyD")],
  "pagescene.camera.up": [b("KeyE")],
  "pagescene.camera.down": [b("KeyQ")],
  "pagescene.camera.pitchUp": [b("ArrowUp")],
  "pagescene.camera.pitchDown": [b("ArrowDown")],
  "pagescene.camera.yawLeft": [b("ArrowLeft")],
  "pagescene.camera.yawRight": [b("ArrowRight")],

  // Transform / view / selection / edit — matching keymap.ts today.
  "pagescene.transform.translate": [b("KeyT")],
  "pagescene.transform.rotate": [b("KeyR")],
  "pagescene.transform.scale": [b("KeyG")],
  "pagescene.transform.toggleSpace": [b("KeyX")],
  "pagescene.transform.poseFK": [b("KeyK")],
  "pagescene.view.focus": [b("KeyF")],
  "pagescene.view.assetMenu": [b("KeyB")],
  "pagescene.view.toggleCameraView": [b("Space")],
  "pagescene.view.toggleStats": [b("Backquote")],
  "pagescene.selection.clearOrExit": [b("Escape")],
  "pagescene.selection.deselectAll": [b("KeyA", { ctrl: true, alt: true })],
  "pagescene.edit.delete": [b("Delete"), b("Backspace")],
  "pagescene.edit.duplicate": [b("KeyD", { ctrl: true })],
  "pagescene.edit.toggleSnapping": [b("KeyN")],
  "pagescene.view.toggleGrid": [b("KeyH")],
  "pagescene.edit.undo": [b("KeyZ", { ctrl: true })],
  "pagescene.edit.redo": [b("KeyZ", { ctrl: true, shift: true }), b("KeyY", { ctrl: true })],
  "pagescene.edit.copy": [b("KeyC", { ctrl: true })],
  "pagescene.edit.paste": [b("KeyV", { ctrl: true })],
};

export const PRESETS: Record<PresetId, Preset> = {
  gamer: {
    id: "gamer",
    label: "Gamer",
    description:
      "Game-style free camera — WASD to move, Q/E down/up, arrows to look. The current Artcraft default.",
    bindings: {}, // BASE is the gamer scheme.
  },
  blender: {
    id: "blender",
    label: "Blender-like",
    description:
      "Familiar to Blender users — G/R/S for grab/rotate/scale and X/Y/Z axis locking during a transform.",
    bindings: {
      "pagescene.transform.translate": [b("KeyG")],
      "pagescene.transform.scale": [b("KeyS")],
      // R (rotate) is the same in both schemes.
      "pagescene.transform.toggleSpace": [b("Backslash")], // X freed for axis-lock (added in a later phase).
      "pagescene.edit.duplicate": [b("KeyD", { shift: true })],
      "pagescene.selection.deselectAll": [b("KeyA", { alt: true })],
    },
  },
};

export const DEFAULT_PRESET: PresetId = "gamer";
