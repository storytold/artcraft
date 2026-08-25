import { Binding } from "./types";

// Event matching + capture. Ctrl and Meta (⌘) are treated interchangeably so a
// binding authored with `ctrl` also fires for Cmd on macOS — the same rule the
// 3D keymap already used.

export function bindingMatchesEvent(binding: Binding, e: KeyboardEvent): boolean {
  if (binding.code !== e.code) return false;
  const ctrlOrMeta = e.ctrlKey || e.metaKey;
  if (!!binding.ctrl !== ctrlOrMeta) return false;
  if (!!binding.shift !== e.shiftKey) return false;
  if (!!binding.alt !== e.altKey) return false;
  return true;
}

const MODIFIER_CODES = new Set([
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
]);

/** Build a Binding from a key press, for the rebind capture UI. Returns null
 *  for a bare modifier press (wait for the real key). */
export function bindingFromEvent(e: KeyboardEvent): Binding | null {
  if (!e.code || MODIFIER_CODES.has(e.code)) return null;
  return {
    code: e.code,
    ctrl: e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    alt: e.altKey,
  };
}

export function bindingsEqual(a: Binding, b: Binding): boolean {
  return (
    a.code === b.code &&
    !!a.ctrl === !!b.ctrl &&
    !!a.shift === !!b.shift &&
    !!a.alt === !!b.alt
  );
}

/** Stable string key for a binding — for conflict maps and React keys. */
export function bindingKey(b: Binding): string {
  return [b.ctrl ? "ctrl" : "", b.shift ? "shift" : "", b.alt ? "alt" : "", b.code]
    .filter(Boolean)
    .join("+");
}

/** The shared "is the user typing in a field?" guard, previously duplicated
 *  across viewport / pagedraw / moodboard listeners. */
export function isEventFromEditableElement(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  if (t.getAttribute?.("role") === "textbox") return true;
  return false;
}
