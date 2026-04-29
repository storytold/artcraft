import type Editor from "../Editor/editor";
import { usePageEnigmaStore, TransformMode } from "../PageEnigmaStore";
import { selectedMode } from "../signals/selectedMode";

const ENGINE_MODE: Record<TransformMode, "translate" | "rotate" | "scale"> = {
  move: "translate",
  rotate: "rotate",
  scale: "scale",
};

export function setTransformMode(editor: Editor, mode: TransformMode): void {
  editor.change_mode(ENGINE_MODE[mode]);
  usePageEnigmaStore.getState().setTransformMode(mode);
  usePageEnigmaStore.getState().setSelectedMode(mode);
  // Keep the legacy signal in sync until Phase 5 retires it.
  selectedMode.value = mode;
}
