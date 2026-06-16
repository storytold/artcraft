import { useEffect, useMemo } from "react";
import type Editor from "../engine/editor";
import { buildKeymap, dispatchBinding } from "../engine/keymap";
import { usePageSceneStore } from "../PageSceneStore";

// Editable inputs we *don't* want shortcut keys to fire from. Mirrors
// the original MouseControls.isEventFromEditableElement guard.
const EDITABLE_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "password",
  "number",
  "url",
  "tel",
]);

const isEventFromEditableElement = (event: KeyboardEvent): boolean => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) {
    if (target.disabled || target.readOnly) return false;
    const type = target.type?.toLowerCase() ?? "";
    return type === "" || EDITABLE_INPUT_TYPES.has(type);
  }
  if (target instanceof HTMLTextAreaElement) {
    return !(target.disabled || target.readOnly);
  }
  return target.isContentEditable;
};

// Canvas-scoped keyboard shortcut handling. Reads the declarative
// keymap and dispatches against incoming events. Listening to
// `keydown` on `document` rather than on the canvas itself because:
// (a) canvas focus is finicky — users shouldn't have to click the
// viewport before T toggles transform mode, and
// (b) the editable-element guard already prevents key handling while
// any input/textarea has focus.
//
// Held movement keys (W/A/S/D etc.) are *not* in this keymap; they're
// owned by useFreeCam since they're continuous motion, not one-shots.

export const useViewportKeyboard = (editor: Editor | null) => {
  const bindings = useMemo(() => buildKeymap(), []);

  useEffect(() => {
    if (!editor) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEventFromEditableElement(event)) return;
      if (usePageSceneStore.getState().hotkeyStatus.disabled) return;
      dispatchBinding(bindings, event, editor);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editor, bindings]);
};
