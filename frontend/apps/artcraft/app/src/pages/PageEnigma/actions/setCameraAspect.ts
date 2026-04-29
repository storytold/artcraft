import type Editor from "../Editor/editor";
import { CameraAspectRatio } from "../enums";
import { setCameraAspectRatio as setCameraAspectSignal } from "../signals/engine";
import { usePageEnigmaStore } from "../PageEnigmaStore";

export function setCameraAspect(
  editor: Editor,
  ratio: CameraAspectRatio,
): void {
  editor.changeRenderCameraAspectRatio(ratio);
  usePageEnigmaStore.getState().setCameraAspectRatio(ratio);
  // Keep the legacy signal in sync until Phase 5 retires it.
  setCameraAspectSignal(ratio);
}
