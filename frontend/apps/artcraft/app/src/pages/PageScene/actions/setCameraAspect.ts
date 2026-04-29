import type Editor from "../engine/editor";
import { CameraAspectRatio } from "../enums";
import { setCameraAspectRatio as setCameraAspectSignal } from "../signals/engine";
import { usePageSceneStore } from "../PageSceneStore";

export function setCameraAspect(
  editor: Editor,
  ratio: CameraAspectRatio,
): void {
  editor.changeRenderCameraAspectRatio(ratio);
  usePageSceneStore.getState().setCameraAspectRatio(ratio);
  // Keep the legacy signal in sync until Phase 5 retires it.
  setCameraAspectSignal(ratio);
}
