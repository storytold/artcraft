import { useEffect } from "react";
import { invokeAction } from ".";
import { useEditor } from "../editor/use-editor";
import { useKeybindingsStore } from "./keybindings-store";
import { isTypableDOMElement } from "../utils/browser";

/**
 * a composable that hooks to the caller component's
 * lifecycle and hooks to the keyboard events to fire
 * the appropriate actions based on keybindings
 */
export function useKeybindingsListener() {
  const editor = useEditor();
  const {
    keybindings,
    getKeybindingString,
    overlayDepth,
    isLoadingProject,
    isRecording,
  } = useKeybindingsStore();

  useEffect(() => {
    const eventOptions: AddEventListenerOptions = { capture: true };
    const handleKeyDown = (ev: KeyboardEvent) => {
      const normalizedKey = (ev.key ?? "").toLowerCase();

      if (overlayDepth > 0 || isLoadingProject || isRecording) {
        return;
      }

      const binding = getKeybindingString(ev);
      const activeElement = document.activeElement;
      const isTextInput =
        activeElement instanceof HTMLElement &&
        isTypableDOMElement({ element: activeElement });
      const boundAction = binding ? keybindings.get(binding) : undefined;

      if (normalizedKey === "escape" && isTextInput) {
        activeElement.blur();
        return;
      }

      if (!binding) return;
      if (!boundAction) return;

      if (isTextInput) return;
      if (boundAction === "paste-copied") {
        if (!editor.clipboard.hasEntry()) return;
        ev.preventDefault();
        invokeAction("paste-copied", undefined, "keypress");
        return;
      }

      ev.preventDefault();

      switch (boundAction) {
        case "seek-forward":
          invokeAction("seek-forward", { seconds: 1 }, "keypress");
          break;
        case "seek-backward":
          invokeAction("seek-backward", { seconds: 1 }, "keypress");
          break;
        case "jump-forward":
          invokeAction("jump-forward", { seconds: 5 }, "keypress");
          break;
        case "jump-backward":
          invokeAction("jump-backward", { seconds: 5 }, "keypress");
          break;
        default:
          invokeAction(boundAction, undefined, "keypress");
      }
    };

    document.addEventListener("keydown", handleKeyDown, eventOptions);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, eventOptions);
    };
  }, [
    keybindings,
    getKeybindingString,
    overlayDepth,
    isLoadingProject,
    isRecording,
    editor,
  ]);
}
