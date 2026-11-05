import { useEffect } from "react";
import type Editor from "../engine/editor";
import { applyNdcToVector2 } from "../engine/pointer";
import { usePageSceneStore } from "../PageSceneStore";
import { EditorStates } from "../enums";

// Canvas-scoped pointer handling for the 3D viewport. Replaces the
// window-level mousemove / click / mousedown / mouseup listeners that
// SceneManager used to attach in dev mode.
//
// Behaviour preserved verbatim from MouseControls (selection raycast,
// gizmo drag, FK joint pick) — this hook is the lifecycle owner; the
// MouseControls class still implements the interaction state machine.
// A follow-up PR can dissolve MouseControls further; for now the goal
// is "no window listeners" + "React owns attachment".

export const useViewportPointer = (
  canvas: HTMLCanvasElement | null,
  editor: Editor | null,
) => {
  // While the camera-view free-cam owns drag state, selection / FK
  // pointer handling stays out of the way.
  const cameraViewActive = usePageSceneStore(
    (s) => s.editorState === EditorStates.CAMERA_VIEW,
  );

  useEffect(() => {
    if (!canvas || !editor) return undefined;

    const onPointerMove = (e: PointerEvent) => {
      if (!editor.mouse) return;
      applyNdcToVector2(
        editor.mouse,
        canvas.getBoundingClientRect(),
        e.clientX,
        e.clientY,
      );
      editor.mouse_controls?.onMouseMove(e as unknown as MouseEvent);
    };

    const onPointerDown = (e: PointerEvent) => {
      editor.mouse_controls?.onMouseDown(e);
    };

    const onPointerUp = (e: PointerEvent) => {
      editor.mouse_controls?.onMouseUp(e);
    };

    // FIX: a touch or pen gesture the browser takes over fires `pointercancel`
    // and never a `pointerup`. MouseControls then kept `isMouseClicked` set, so
    // every later mouse move rotated the camera as if a button were still held
    // (the same gap B-106 closed for the free-cam drag). Treat a cancel as a
    // primary-button release; `button: 0` is passed explicitly because a cancel
    // event does not reliably carry the button that was pressed.
    const onPointerCancel = () => {
      editor.mouse_controls?.onMouseUp({ button: 0 });
    };

    const onClick = (_e: MouseEvent) => {
      if (cameraViewActive) return;
      editor.mouse_controls?.onMouseClick();
    };

    // Double-click toggles camera view: anywhere exits when active; on the
    // render-camera frustum (selected by the preceding click) it enters.
    const onDoubleClick = () => {
      if (cameraViewActive) {
        editor.cameraController.exitCameraView();
        return;
      }
      const selected = editor.sceneManager?.selected_objects?.[0];
      if (selected?.name === "::CAM::") {
        editor.cameraController.enterCameraView();
      }
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("dblclick", onDoubleClick);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("dblclick", onDoubleClick);
    };
  }, [canvas, editor, cameraViewActive]);
};
