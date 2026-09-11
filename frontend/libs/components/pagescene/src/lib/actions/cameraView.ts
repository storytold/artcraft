import type Editor from "../engine/editor";
import { CameraViewToggleRequestedEvent } from "../engine/events/EngineEvent";

// Toggle "camera view" (look through / exit the render camera). Used by the
// outliner view-from-camera icon and the exit-camera-view button. Routes
// through the bus so the CameraController owns the actual transition.
export function toggleCameraView(editor: Editor): void {
  editor.bus.emit(new CameraViewToggleRequestedEvent());
}
