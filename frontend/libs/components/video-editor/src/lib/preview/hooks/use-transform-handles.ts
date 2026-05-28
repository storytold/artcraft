import { useEffect, useReducer, useState } from "react";
import { usePreviewViewport } from "../components/preview-viewport";
import type { OnSnapLinesChange } from "./use-preview-interaction";
import { useEditor } from "../../editor/use-editor";
import { useCommittedRef } from "../../hooks/use-committed-ref";
import { useShiftKey } from "../../hooks/use-shift-key";
import { registerCanceller } from "../../editor/cancel-interaction";
import {
  TransformHandleController,
  type TransformHandleDeps,
} from "../controllers/transform-handle-controller";

export function useTransformHandles({
  onSnapLinesChange,
}: {
  onSnapLinesChange?: OnSnapLinesChange;
}) {
  const viewport = usePreviewViewport();
  const editor = useEditor();
  const isShiftHeldRef = useShiftKey();
  const selectedElements = useEditor((e) => e.selection.getSelectedElements());
  const tracks = useEditor(
    (e) => e.timeline.getPreviewTracks() ?? e.scenes.getActiveScene().tracks,
  );
  const currentTime = useEditor((e) => e.playback.getCurrentTime());
  const mediaAssets = useEditor((e) => e.media.getAssets());
  const canvasSize = useEditor(
    (e) => e.project.getActive().settings.canvasSize,
  );
  const deps: TransformHandleDeps = {
    viewport,
    input: {
      isShiftHeld: () => isShiftHeldRef.current,
    },
    scene: {
      getSelectedElements: () => selectedElements,
      getTracks: () => tracks,
      getCurrentTime: () => currentTime,
      getMediaAssets: () => mediaAssets,
      getCanvasSize: () => canvasSize,
    },
    timeline: {
      previewElements: (updates) =>
        editor.timeline.previewElements({ updates }),
      commitPreview: () => editor.timeline.commitPreview(),
      discardPreview: () => editor.timeline.discardPreview(),
    },
    preview: {
      onSnapLinesChange,
    },
  };
  const depsRef = useCommittedRef(deps);
  const [controller] = useState(
    () => new TransformHandleController({ depsRef }),
  );

  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => controller.subscribe(rerender), [controller]);

  useEffect(() => {
    if (!controller.isActive) return undefined;
    return registerCanceller({ fn: () => controller.cancel() });
  }, [controller, controller.isActive]);

  useEffect(() => () => controller.destroy(), [controller]);

  const selectedWithBounds = controller.selectedWithBounds;
  const hasVisualSelection = selectedWithBounds !== null;

  return {
    selectedWithBounds,
    hasVisualSelection,
    activeHandle: controller.activeHandle,
    handleCornerPointerDown: controller.onCornerPointerDown,
    handleEdgePointerDown: controller.onEdgePointerDown,
    handleRotationPointerDown: controller.onRotationPointerDown,
    handlePointerMove: controller.onPointerMove,
    handlePointerUp: controller.onPointerUp,
  };
}
