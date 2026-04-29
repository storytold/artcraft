import type Editor from "../engine/editor";
import { usePageSceneStore, TransformMode } from "../PageSceneStore";

const ENGINE_MODE: Record<TransformMode, "translate" | "rotate" | "scale"> = {
  move: "translate",
  rotate: "rotate",
  scale: "scale",
};

export function setTransformMode(editor: Editor, mode: TransformMode): void {
  editor.change_mode(ENGINE_MODE[mode]);
  const store = usePageSceneStore.getState();
  store.setTransformMode(mode);
  store.setSelectedMode(mode);
}
