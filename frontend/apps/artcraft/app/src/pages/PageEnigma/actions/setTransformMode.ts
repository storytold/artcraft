import type Editor from "../Editor/editor";
import { usePageEnigmaStore, TransformMode } from "../PageEnigmaStore";

const ENGINE_MODE: Record<TransformMode, "translate" | "rotate" | "scale"> = {
  move: "translate",
  rotate: "rotate",
  scale: "scale",
};

export function setTransformMode(editor: Editor, mode: TransformMode): void {
  editor.change_mode(ENGINE_MODE[mode]);
  const store = usePageEnigmaStore.getState();
  store.setTransformMode(mode);
  store.setSelectedMode(mode);
}
