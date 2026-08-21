import { useEffect, useMemo } from "react";
import { useResolvedKeybinds, type KeybindContext } from "@storyteller/keybinds";
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
  // Resolve from the unified keybinds store; `forAction` identity changes when
  // the preset or any override changes, rebuilding the keymap + re-binding.
  const { forAction } = useResolvedKeybinds();
  const bindings = useMemo(() => buildKeymap(forAction), [forAction]);

  useEffect(() => {
    if (!editor) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEventFromEditableElement(event)) return;
      const store = usePageSceneStore.getState();
      if (store.hotkeyStatus.disabled) return;
      // While a modal transform owns input (axis-lock keys, confirm/cancel),
      // don't also fire normal viewport shortcuts.
      if (store.modalTransformActive) return;
      // Availability context for the registry's `when` gates. Read fresh per
      // event so mode flips apply without re-binding the listener.
      // `timelineSelection` must be a VALIDATED selection — a stale id (e.g.
      // after Cancel / undo-of-Save replaced the timeline wholesale) reports
      // false, so Delete falls through to the scene-object action.
      const keyframeId = store.timelineSelectedKeyframeId;
      const laneId = store.timelineSelectedClipLaneId;
      const timelineSelection =
        (keyframeId !== null &&
          store.timelineTracks.some((t) =>
            t.keyframes.some((k) => k.id === keyframeId),
          )) ||
        (laneId !== null &&
          store.timelineClipLanes.some((l) => l.id === laneId));
      const ctx: KeybindContext = {
        sceneMode: store.sceneMode,
        encoding: store.recordingProgress !== null,
        timelineExpanded: store.timelineExpanded,
        timelineSelection,
        modalTransformActive: store.modalTransformActive,
      };
      dispatchBinding(bindings, event, editor, ctx);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editor, bindings]);
};
