import { useEffect, useRef } from "react";
import { MathUtils } from "three";
import {
  createFreeCamControlState,
  emptyMoveKeys,
  emptyRotateKeys,
  moveSlotForKeyCode,
  panFromDrag,
  rotateSlotForKeyCode,
  zoomFromWheel,
  type FreeCamControlState,
} from "../engine/cameraMath";
import { usePageSceneStore } from "../PageSceneStore";
import type Editor from "../engine/editor";

// Drives the 3D viewport's "fly" camera controls (right-click pan,
// wheel zoom, WASD/QE forward/back/strafe/up/down, arrow-key roll/yaw)
// for navigating the scene in EDIT mode. CAMERA_VIEW (the virtual-
// camera POV preview) re-uses the same input pipeline.
//
// Pointer + wheel listeners go on the canvas (events naturally route
// to canvas regardless of focus). WASD/QE/arrow keys go on document
// with an editable-element guard, so the user can fly without
// clicking the canvas first to give it focus.

const EDITABLE_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "password",
  "number",
  "url",
  "tel",
]);

const isEventFromEditableElement = (event: KeyboardEvent): boolean => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) {
    if (target.disabled || target.readOnly) return false;
    const type = target.type?.toLowerCase() ?? "";
    return type === "" || EDITABLE_INPUT_TYPES.has(type);
  }
  if (target instanceof HTMLTextAreaElement) {
    return !(target.disabled || target.readOnly);
  }
  return target.isContentEditable;
};

export const useFreeCam = (
  canvas: HTMLCanvasElement | null,
  editor: Editor | null,
) => {
  const stateRef = useRef<FreeCamControlState>(createFreeCamControlState());
  const dragRef = useRef<{ x: number; y: number; pointerId: number } | null>(
    null,
  );

  // Hand the state to the editor so its render loop can integrate it.
  useEffect(() => {
    if (!editor) return;
    editor.cameraController.setFreeCamState(stateRef.current);
    return () => editor.cameraController.setFreeCamState(null);
  }, [editor]);

  // Attach listeners. Pointer/wheel on canvas (so they only fire
  // inside the viewport); keys on document so the user doesn't need
  // to click canvas first for WASD to work.
  useEffect(() => {
    if (!canvas || !editor) return;
    const state = stateRef.current;
    state.enabled = true;

    const onKeyDown = (e: KeyboardEvent) => {
      if (usePageSceneStore.getState().isPromptBoxFocused) return;
      if (isEventFromEditableElement(e)) return;
      const moveSlot = moveSlotForKeyCode(e.code);
      if (moveSlot) state.moveKeys[moveSlot] = 1;
      const rotateSlot = rotateSlotForKeyCode(e.code);
      if (rotateSlot) state.rotateKeys[rotateSlot] = 1;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (usePageSceneStore.getState().isPromptBoxFocused) return;
      if (isEventFromEditableElement(e)) return;
      const moveSlot = moveSlotForKeyCode(e.code);
      if (moveSlot) state.moveKeys[moveSlot] = 0;
      const rotateSlot = rotateSlotForKeyCode(e.code);
      if (rotateSlot) state.rotateKeys[rotateSlot] = 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 2) return;
      dragRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
      state.velocity.set(0, 0, 0);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // pointerCapture can throw if pointer is already captured elsewhere
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore: capture may already be released
      }
      dragRef.current = null;
      state.velocity.set(0, 0, 0);
    };

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const camera = editor.cameraController.camera;
      if (!drag || !camera) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) === 0) return;

      const pan = panFromDrag(dx, dy, state.movementSpeed);
      state.velocity.x = MathUtils.lerp(state.velocity.x, pan.x, state.smoothing);
      state.velocity.y = MathUtils.lerp(state.velocity.y, pan.y, state.smoothing);
      camera.translateX(state.velocity.x);
      camera.translateY(state.velocity.y);
    };

    const onWheel = (e: WheelEvent) => {
      const camera = editor.cameraController.camera;
      if (!camera) return;
      const z = zoomFromWheel(e.deltaY);
      state.velocity.z = MathUtils.lerp(state.velocity.z, z, state.smoothing);
      camera.translateZ(state.velocity.z);
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    canvas.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      state.enabled = false;
      state.moveKeys = emptyMoveKeys();
      state.rotateKeys = emptyRotateKeys();
      state.velocity.set(0, 0, 0);
      dragRef.current = null;
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [canvas, editor]);
};
