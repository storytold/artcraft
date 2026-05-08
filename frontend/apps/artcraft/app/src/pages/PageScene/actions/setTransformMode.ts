import type Editor from "../engine/editor";
import type { TransformMode } from "../PageSceneStore";
import {
  SelectedModeChangedEvent,
  TransformModeChangedEvent,
} from "../engine/events/EngineEvent";

const ENGINE_MODE: Record<TransformMode, "translate" | "rotate" | "scale"> = {
  move: "translate",
  rotate: "rotate",
  scale: "scale",
};

export function setTransformMode(editor: Editor, mode: TransformMode): void {
  editor.gizmo.changeMode(ENGINE_MODE[mode]);
  editor.bus.emit(new TransformModeChangedEvent(mode));
  editor.bus.emit(new SelectedModeChangedEvent(mode));
}
