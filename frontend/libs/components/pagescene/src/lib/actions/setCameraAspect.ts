import type Editor from "../engine/editor";
import { CameraAspectRatio } from "../enums";
import { CameraAspectRatioChangedEvent } from "../engine/events/EngineEvent";

export function setCameraAspect(
  editor: Editor,
  ratio: CameraAspectRatio,
): void {
  editor.cameraController.changeRenderCameraAspectRatio(ratio);
  editor.bus.emit(new CameraAspectRatioChangedEvent(ratio));
}
