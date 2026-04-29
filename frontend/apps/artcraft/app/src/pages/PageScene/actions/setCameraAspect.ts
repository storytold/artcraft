import type Editor from "../engine/editor";
import { CameraAspectRatio } from "../enums";
import { usePageSceneStore } from "../PageSceneStore";

export function setCameraAspect(
  editor: Editor,
  ratio: CameraAspectRatio,
): void {
  editor.changeRenderCameraAspectRatio(ratio);
  usePageSceneStore.getState().setCameraAspectRatio(ratio);
}
