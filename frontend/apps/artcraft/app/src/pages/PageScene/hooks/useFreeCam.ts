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
} from "~/pages/PageScene/engine/cameraMath";
import { isPromptBoxFocused } from "~/pages/PageScene/signals/promptBox";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
import { EditorStates } from "~/pages/PageScene/enums";
import type Editor from "~/pages/PageScene/engine/editor";

// Drives the 3D viewport's camera while the editor is in CAMERA_VIEW.
// Owns:
//   - Listener attachment to the canvas (no window/document handlers).
//   - Drag state + held-key state in refs.
//   - The shared FreeCamControlState handed to the editor's render
//     loop via setFreeCamState.
//
// The editor reads this state on every frame (see editor.ts render
// loop) and integrates it via freeCamFrameTick. There is no FreeCam
// class instance — the math lives in cameraMath.ts.

export const useFreeCam = (
  canvas: HTMLCanvasElement | null,
  editor: Editor | null,
) => {
  const stateRef = useRef<FreeCamControlState>(createFreeCamControlState());
  const dragRef = useRef<{ x: number; y: number; pointerId: number } | null>(
    null,
  );
  const enabled = usePageSceneStore(
    (s) => s.editorState === EditorStates.CAMERA_VIEW,
  );

  // Hand the state to the editor so its render loop can integrate it.
  useEffect(() => {
    if (!editor) return;
    editor.setFreeCamState(stateRef.current);
    return () => editor.setFreeCamState(null);
  }, [editor]);

  // Toggle enabled and clear motion when leaving CAMERA_VIEW so the
  // camera doesn't drift on a stale held key.
  useEffect(() => {
    const state = stateRef.current;
    state.enabled = enabled;
    if (!enabled) {
      state.moveKeys = emptyMoveKeys();
      state.rotateKeys = emptyRotateKeys();
      state.velocity.set(0, 0, 0);
      dragRef.current = null;
    }
  }, [enabled]);

  // Attach listeners to the canvas. Canvas-scoped means no listener
  // leaks beyond the viewport, and no need for mouseover gating.
  useEffect(() => {
    if (!canvas || !enabled || !editor) return;
    const state = stateRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isPromptBoxFocused.value) return;
      const moveSlot = moveSlotForKeyCode(e.code);
      if (moveSlot) state.moveKeys[moveSlot] = 1;
      const rotateSlot = rotateSlotForKeyCode(e.code);
      if (rotateSlot) state.rotateKeys[rotateSlot] = 1;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isPromptBoxFocused.value) return;
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
      if (!drag || !editor.camera) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) === 0) return;

      const pan = panFromDrag(dx, dy, state.movementSpeed);
      state.velocity.x = MathUtils.lerp(state.velocity.x, pan.x, state.smoothing);
      state.velocity.y = MathUtils.lerp(state.velocity.y, pan.y, state.smoothing);
      editor.camera.translateX(state.velocity.x);
      editor.camera.translateY(state.velocity.y);
    };

    const onWheel = (e: WheelEvent) => {
      if (!editor.camera) return;
      const z = zoomFromWheel(e.deltaY);
      state.velocity.z = MathUtils.lerp(state.velocity.z, z, state.smoothing);
      editor.camera.translateZ(state.velocity.z);
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [canvas, editor, enabled]);
};
