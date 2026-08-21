// Core vocabulary for the unified keybinds system.
//
// A `Binding` is stored by physical `event.code` (e.g. "KeyW") rather than the
// produced character, so WASD-style layouts survive AZERTY/Dvorak and so the
// representation matches the 3D viewport's existing keymap. Each remappable
// operation is an `ActionDef` in the registry; presets and per-user overrides
// supply the `Binding[]` for each action id.

export interface Binding {
  /** Physical key, matching KeyboardEvent.code (e.g. "KeyW", "Space", "Delete"). */
  code: string;
  ctrl?: boolean; // Ctrl on Windows/Linux, Cmd on macOS (treated interchangeably).
  shift?: boolean;
  alt?: boolean;
}

export type Surface = "pagescene" | "pagedraw" | "moodboard";

export type KeyGroup =
  | "Camera"
  | "Transform"
  | "Selection"
  | "Edit"
  | "View"
  | "Tools"
  | "Record"
  | "History";

export type ActionId = string; // surface-namespaced, e.g. "pagescene.transform.translate"

/** Editor state a surface hands to `ActionDef.when` availability gates. All
 *  fields are optional — each surface supplies the ones it has. Adding a field
 *  here (rather than ad-hoc checks in handlers) keeps availability visible to
 *  the settings/cheatsheet UIs and to future surfaces. */
export interface KeybindContext {
  /** 3D top-level mode; "record" is immutable playback/output. */
  sceneMode?: "build" | "record";
  /** A timeline→video encode is running (progress overlay up). */
  encoding?: boolean;
  /** The expanded timeline editor is open. */
  timelineExpanded?: boolean;
  /** A Blender-style modal transform owns input. */
  modalTransformActive?: boolean;
}

export interface ActionDef {
  id: ActionId;
  label: string;
  group: KeyGroup;
  surface: Surface;
  /** Held key that drives continuous motion (camera). Must stay single-key,
   *  no-modifier; the capture UI enforces this. */
  continuous?: boolean;
  /** Surfaced in the quick cheatsheet overlay. */
  important?: boolean;
  /** preventDefault + stopPropagation when matched (browser-conflict keys). */
  preventDefault?: boolean;
  /** Only active inside a Blender-style modal transform (axis lock). */
  modalOnly?: boolean;
  /** Availability gate, evaluated at dispatch time. Omitted = the default
   *  rule "available unless an encode is running". Supplying `when` takes
   *  FULL control of availability — re-check `ctx.encoding` yourself unless
   *  the action is deliberately live mid-encode (e.g. cancel-encode). An
   *  unavailable binding is inert: the event falls through untouched. */
  when?: (ctx: KeybindContext) => boolean;
}

export type PresetId = "gamer" | "blender";

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  /** Bindings that DIFFER from BASE for this preset (3D-only deltas). */
  bindings: Partial<Record<ActionId, Binding[]>>;
}
