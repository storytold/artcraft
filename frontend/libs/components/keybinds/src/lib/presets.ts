import { ActionId, Binding, Preset, PresetId } from "./types";

// BASE_BINDINGS is the "Gamer" scheme — it MUST reproduce the app's current
// hardcoded bindings exactly so adopting the system changes nothing by default.
// Presets list only the actions that DIFFER from BASE (3D-only deltas); every
// other action falls through to BASE regardless of selected preset, so 2D and
// moodboard are unaffected by preset choice.

const b = (code: string, mods: Omit<Binding, "code"> = {}): Binding => ({ code, ...mods });

export const BASE_BINDINGS: Record<ActionId, Binding[]> = {
  // Global — app-wide trigger layer, preset-independent.
  "global.ui.toggleSidebar": [b("KeyB", { ctrl: true })],

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

  // Timeline (context-gated; Space/arrows are shared with camera actions via
  // mutually exclusive `when` predicates — see the registry).
  "pagescene.timeline.playPause": [b("Space")],
  "pagescene.timeline.stepBack": [b("ArrowLeft")],
  "pagescene.timeline.stepForward": [b("ArrowRight")],
  "pagescene.timeline.nudgeLeft": [b("ArrowLeft")],
  "pagescene.timeline.nudgeRight": [b("ArrowRight")],
  "pagescene.timeline.goToStart": [b("Home")],
  "pagescene.timeline.goToEnd": [b("End")],
  "pagescene.timeline.addKeyframe": [b("KeyI")], // Blender parity
  "pagescene.timeline.deleteSelected": [b("Delete"), b("Backspace")],
  "pagescene.timeline.toggleExpanded": [b("KeyT", { shift: true })],

  // Record
  "pagescene.record.toggleMode": [b("Tab")],
  "pagescene.record.captureStill": [b("KeyS", { ctrl: true, shift: true })],
  "pagescene.record.recordVideo": [b("KeyE", { ctrl: true, shift: true })],
  "pagescene.record.cancelEncode": [b("Escape")],

  // PageDraw (2D) — preset-independent.
  "pagedraw.tools.select": [b("Digit1")],
  "pagedraw.tools.shape": [b("Digit2")],
  "pagedraw.tools.brush": [b("Digit3")],
  "pagedraw.tools.mask": [b("Digit4")],
  "pagedraw.tools.eraser": [b("Digit5")],
  // MS-Paint-style size keys; numpad variants included.
  "pagedraw.tools.brushSizeUp": [
    b("Equal", { ctrl: true }),
    b("NumpadAdd", { ctrl: true }),
  ],
  "pagedraw.tools.brushSizeDown": [
    b("Minus", { ctrl: true }),
    b("NumpadSubtract", { ctrl: true }),
  ],
  "pagedraw.edit.delete": [b("Delete"), b("Backspace")],
  "pagedraw.edit.copy": [b("KeyC", { ctrl: true })],
  "pagedraw.edit.paste": [b("KeyV", { ctrl: true })],
  "pagedraw.history.undo": [b("KeyZ", { ctrl: true })],
  "pagedraw.history.redo": [b("KeyZ", { ctrl: true, shift: true }), b("KeyY", { ctrl: true })],

  // Moodboard — preset-independent (Figma-style).
  "moodboard.tools.select": [b("KeyV")],
  "moodboard.tools.lasso": [b("KeyL")],
  "moodboard.tools.text": [b("KeyT")],
  "moodboard.selection.selectAll": [b("KeyA", { ctrl: true })],
  "moodboard.selection.clear": [b("Escape")],
  "moodboard.edit.delete": [b("Delete"), b("Backspace")],
  "moodboard.edit.group": [b("KeyG", { ctrl: true })],
  "moodboard.edit.ungroup": [b("KeyG", { ctrl: true, shift: true })],
  "moodboard.view.fitToContent": [b("Digit1", { shift: true })],
  "moodboard.history.undo": [b("KeyZ", { ctrl: true })],
  "moodboard.history.redo": [b("KeyZ", { ctrl: true, shift: true }), b("KeyY", { ctrl: true })],
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
      // Camera moves off WASD/QE onto the numpad (Blender's navigation cluster),
      // with the top-row digits as the laptop-friendly "Emulate Numpad" mirror.
      // This frees the letter keys for transform ops below — without it, scale (S)
      // would collide with camera-back (S). Look stays on the arrow keys (BASE).
      "pagescene.camera.forward": [b("Numpad8"), b("Digit8")],
      "pagescene.camera.back": [b("Numpad2"), b("Digit2")],
      "pagescene.camera.left": [b("Numpad4"), b("Digit4")],
      "pagescene.camera.right": [b("Numpad6"), b("Digit6")],
      "pagescene.camera.up": [b("Numpad9"), b("Digit9")],
      "pagescene.camera.down": [b("Numpad3"), b("Digit3")],
      // G is Blender's modal "grab" (move with the mouse + X/Y/Z axis lock),
      // not a gizmo-mode toggle — so translate-mode stays on its BASE key (T).
      "pagescene.transform.grab": [b("KeyG")],
      "pagescene.transform.scale": [b("KeyS")],
      // R (rotate) is the same in both schemes.
      "pagescene.transform.toggleSpace": [b("Backslash")], // X freed for axis-lock.
      "pagescene.edit.duplicate": [b("KeyD", { shift: true })],
      "pagescene.selection.deselectAll": [b("KeyA", { alt: true })],
    },
  },
};

export const DEFAULT_PRESET: PresetId = "gamer";
