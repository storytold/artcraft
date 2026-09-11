import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePreviewViewport } from "../preview/components/preview-viewport";
import { useEditor } from "../editor/use-editor";
import { useShiftKey } from "../hooks/use-shift-key";
import { getMaskDefinition } from "./index";
import { appendPointToFreeformPathMask } from "./freeform/definition";
import {
  getVisibleElementsWithBounds,
  type ElementBounds,
} from "../preview/element-bounds";
import {
  SNAP_THRESHOLD_SCREEN_PIXELS,
  type SnapLine,
} from "../preview/preview-snap";
import type { SelectedMaskPointSelection } from "../selection/editor-selection";
import type { Mask, MaskHandleId, MaskInteractionResult } from "./types";
import type { MaskableElement } from "../timeline/types";
import { isMaskableElement } from "../timeline/element-utils";
import { registerCanceller } from "../editor/cancel-interaction";

interface DragState {
  trackId: string;
  elementId: string;
  handleId: MaskHandleId;
  startCanvasX: number;
  startCanvasY: number;
  startParams: Mask["params"];
}

interface PendingSegmentInsertState {
  trackId: string;
  elementId: string;
  maskId: string;
  segmentIndex: number;
  startClientX: number;
  startClientY: number;
  startCanvasX: number;
  startCanvasY: number;
  startParams: Mask["params"];
  bounds: ElementBounds;
}

const SEGMENT_CLICK_DRAG_THRESHOLD_PX = 4;

function isMaskSelectionForElement({
  trackId,
  elementId,
  maskId,
  selection,
}: {
  trackId: string;
  elementId: string;
  maskId: string;
  selection: SelectedMaskPointSelection | null;
}): boolean {
  if (!selection) {
    return false;
  }
  return (
    selection.trackId === trackId &&
    selection.elementId === elementId &&
    selection.maskId === maskId
  );
}

function replaceElementMask({
  masks,
  updatedMask,
}: {
  masks: MaskableElement["masks"];
  updatedMask: Mask;
}): Mask[] {
  return (masks ?? []).map((mask) =>
    mask.id === updatedMask.id ? updatedMask : mask,
  );
}

function withUpdatedMaskParams<TMask extends Mask>({
  mask,
  params,
}: {
  mask: TMask;
  params: TMask["params"];
}): TMask {
  return {
    ...mask,
    params,
  };
}

export function useMaskHandles({
  onSnapLinesChange,
}: {
  onSnapLinesChange?: (lines: SnapLine[]) => void;
}) {
  const editor = useEditor();
  const isShiftHeldRef = useShiftKey();
  const viewport = usePreviewViewport();
  const [activeHandleId, setActiveHandleId] = useState<MaskHandleId | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const pendingSegmentInsertRef = useRef<PendingSegmentInsertState | null>(
    null,
  );
  const captureRef = useRef<{ element: Element; pointerId: number } | null>(
    null,
  );

  const tracks = useEditor(
    (e) => e.timeline.getPreviewTracks() ?? e.scenes.getActiveScene().tracks,
  );
  const currentTime = useEditor((e) => e.playback.getCurrentTime());
  const mediaAssets = useEditor((e) => e.media.getAssets());
  const canvasSize = useEditor(
    (e) => e.project.getActive().settings.canvasSize,
  );
  const selectedElements = useEditor((e) => e.selection.getSelectedElements());
  const selectedMaskPointSelection = useEditor((e) =>
    e.selection.getSelectedMaskPointSelection(),
  );

  const elementsWithBounds = getVisibleElementsWithBounds({
    tracks,
    currentTime,
    canvasSize,
    mediaAssets,
  });

  const selectedWithMask =
    selectedElements.length === 1
      ? (() => {
          const sel = selectedElements[0];
          const entry = elementsWithBounds.find(
            (item) =>
              item.trackId === sel.trackId && item.elementId === sel.elementId,
          );
          if (!entry) return null;
          if (!isMaskableElement(entry.element)) return null;
          const element = entry.element;
          const masks = element.masks ?? [];
          if (masks.length === 0) return null;
          const activeMaskId = masks.some((mask) =>
            isMaskSelectionForElement({
              trackId: entry.trackId,
              elementId: entry.elementId,
              maskId: mask.id,
              selection: selectedMaskPointSelection,
            }),
          )
            ? selectedMaskPointSelection?.maskId
            : masks[0].id;
          const mask =
            masks.find((candidate) => candidate.id === activeMaskId) ??
            masks[0];
          return { ...entry, element, mask };
        })()
      : null;

  const { handles: baseHandlePositions, overlays }: MaskInteractionResult =
    selectedWithMask
      ? (() => {
          const def = getMaskDefinition(selectedWithMask.mask.type);
          const { x: scaleX, y: scaleY } = viewport.getDisplayScale();
          const displayScale = (scaleX + scaleY) / 2;
          return def.interaction.getInteraction({
            params: selectedWithMask.mask.params,
            bounds: selectedWithMask.bounds,
            displayScale,
            scaleX,
            scaleY,
          });
        })()
      : { handles: [], overlays: [] };

  const selectedPointIds = new Set(
    selectedWithMask &&
      isMaskSelectionForElement({
        trackId: selectedWithMask.trackId,
        elementId: selectedWithMask.elementId,
        maskId: selectedWithMask.mask.id,
        selection: selectedMaskPointSelection,
      })
      ? (selectedMaskPointSelection?.pointIds ?? [])
      : [],
  );

  const handlePositions = baseHandlePositions.map((handle) => {
    if (handle.id.kind !== "anchor") {
      return handle;
    }
    return {
      ...handle,
      isSelected: selectedPointIds.has(handle.id.pointId),
    };
  });

  const customMaskPointIds = useMemo(
    () =>
      selectedWithMask?.mask.type === "freeform"
        ? handlePositions
            .filter((h) => h.kind === "point")
            .map((h) => {
              return h.id.kind === "anchor" ? h.id.pointId : null;
            })
            .filter((id): id is string => id !== null)
        : [],
    [handlePositions, selectedWithMask?.mask.type],
  );
  const isCreatingFreeformPathMask =
    selectedWithMask?.mask.type === "freeform" &&
    (!selectedWithMask.mask.params.closed || customMaskPointIds.length === 0);

  useEffect(() => {
    if (!selectedMaskPointSelection) {
      return;
    }
    if (
      !selectedWithMask ||
      selectedWithMask.mask.type !== "freeform" ||
      !isMaskSelectionForElement({
        trackId: selectedWithMask.trackId,
        elementId: selectedWithMask.elementId,
        maskId: selectedWithMask.mask.id,
        selection: selectedMaskPointSelection,
      })
    ) {
      editor.selection.clearMaskPointSelection();
      return;
    }

    const availablePointIds = new Set(customMaskPointIds);
    const nextSelectedPointIds = selectedMaskPointSelection.pointIds.filter(
      (pointId) => availablePointIds.has(pointId),
    );
    if (
      nextSelectedPointIds.length === selectedMaskPointSelection.pointIds.length
    ) {
      return;
    }
    if (nextSelectedPointIds.length === 0) {
      editor.selection.clearMaskPointSelection();
      return;
    }

    editor.selection.setSelectedMaskPoints({
      selection: {
        ...selectedMaskPointSelection,
        pointIds: nextSelectedPointIds,
      },
    });
  }, [
    customMaskPointIds,
    editor.selection,
    selectedMaskPointSelection,
    selectedWithMask,
  ]);

  const updateFreeformPathMaskPointSelection = useCallback(
    ({
      pointId,
      toggleSelection,
    }: {
      pointId: string;
      toggleSelection: boolean;
    }) => {
      if (!selectedWithMask || selectedWithMask.mask.type !== "freeform") {
        return;
      }

      const isSelectionForCurrentMask = isMaskSelectionForElement({
        trackId: selectedWithMask.trackId,
        elementId: selectedWithMask.elementId,
        maskId: selectedWithMask.mask.id,
        selection: selectedMaskPointSelection,
      });
      const currentPointIds = isSelectionForCurrentMask
        ? (selectedMaskPointSelection?.pointIds ?? [])
        : [];
      const nextPointIds = toggleSelection
        ? currentPointIds.includes(pointId)
          ? currentPointIds.filter(
              (currentPointId) => currentPointId !== pointId,
            )
          : [...currentPointIds, pointId]
        : [pointId];

      if (nextPointIds.length === 0) {
        editor.selection.clearMaskPointSelection();
        return;
      }

      editor.selection.setSelectedMaskPoints({
        selection: {
          trackId: selectedWithMask.trackId,
          elementId: selectedWithMask.elementId,
          maskId: selectedWithMask.mask.id,
          pointIds: nextPointIds,
        },
      });
    },
    [editor.selection, selectedMaskPointSelection, selectedWithMask],
  );

  const clearMaskHandleState = useCallback(() => {
    dragStateRef.current = null;
    pendingSegmentInsertRef.current = null;
    setActiveHandleId(null);
    onSnapLinesChange?.([]);
  }, [onSnapLinesChange]);

  const releaseCapturedPointer = useCallback(() => {
    const capture = captureRef.current;
    if (!capture) return;

    if (capture.element.hasPointerCapture(capture.pointerId)) {
      capture.element.releasePointerCapture(capture.pointerId);
    }

    captureRef.current = null;
  }, []);

  useEffect(() => {
    if (!activeHandleId) return;

    return registerCanceller({
      fn: () => {
        editor.timeline.discardPreview();
        clearMaskHandleState();
        releaseCapturedPointer();
      },
    });
  }, [
    activeHandleId,
    clearMaskHandleState,
    editor.timeline,
    releaseCapturedPointer,
  ]);

  const handlePointerDown = useCallback(
    ({
      event,
      handleId,
    }: {
      event: React.PointerEvent;
      handleId: MaskHandleId;
    }) => {
      if (!selectedWithMask) return;
      if (event.button !== 0) return;
      event.stopPropagation();
      const anchorHandle =
        selectedWithMask.mask.type === "freeform" && handleId.kind === "anchor"
          ? handleId
          : null;
      const segmentHandle =
        selectedWithMask.mask.type === "freeform" && handleId.kind === "segment"
          ? handleId
          : null;
      if (isCreatingFreeformPathMask) {
        const firstPointId = customMaskPointIds[0];
        if (
          firstPointId &&
          handleId.kind === "anchor" &&
          handleId.pointId === firstPointId &&
          customMaskPointIds.length >= 3 &&
          selectedWithMask.mask.type === "freeform"
        ) {
          const updatedMask = withUpdatedMaskParams({
            mask: selectedWithMask.mask,
            params: {
              ...selectedWithMask.mask.params,
              closed: true,
            },
          });
          editor.timeline.updateElements({
            updates: [
              {
                trackId: selectedWithMask.trackId,
                elementId: selectedWithMask.elementId,
                patch: {
                  masks: replaceElementMask({
                    masks: selectedWithMask.element.masks,
                    updatedMask,
                  }),
                } as Partial<MaskableElement>,
              },
            ],
          });
        }
        return;
      }

      const pos = viewport.screenToCanvas({
        clientX: event.clientX,
        clientY: event.clientY,
      });
      if (!pos) return;

      if (segmentHandle && selectedWithMask.mask.type === "freeform") {
        setActiveHandleId(handleId);
        pendingSegmentInsertRef.current = {
          trackId: selectedWithMask.trackId,
          elementId: selectedWithMask.elementId,
          maskId: selectedWithMask.mask.id,
          segmentIndex: segmentHandle.index,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startCanvasX: pos.x,
          startCanvasY: pos.y,
          startParams: { ...selectedWithMask.mask.params },
          bounds: selectedWithMask.bounds,
        };
        const captureTarget = event.currentTarget;
        captureTarget.setPointerCapture(event.pointerId);
        captureRef.current = {
          element: captureTarget,
          pointerId: event.pointerId,
        };
        return;
      }

      if (anchorHandle) {
        updateFreeformPathMaskPointSelection({
          pointId: anchorHandle.pointId,
          toggleSelection: event.shiftKey,
        });
        if (event.shiftKey) {
          return;
        }
      } else if (selectedWithMask.mask.type === "freeform") {
        editor.selection.clearMaskPointSelection();
      }

      dragStateRef.current = {
        trackId: selectedWithMask.trackId,
        elementId: selectedWithMask.elementId,
        handleId,
        startCanvasX: pos.x,
        startCanvasY: pos.y,
        startParams: { ...selectedWithMask.mask.params },
      };
      setActiveHandleId(handleId);
      const captureTarget = event.currentTarget;
      captureTarget.setPointerCapture(event.pointerId);
      captureRef.current = {
        element: captureTarget,
        pointerId: event.pointerId,
      };
    },
    [
      customMaskPointIds,
      editor.selection,
      editor.timeline,
      isCreatingFreeformPathMask,
      selectedWithMask,
      updateFreeformPathMaskPointSelection,
      viewport,
    ],
  );

  const handleCanvasPointerDown = useCallback(
    ({ event }: { event: React.PointerEvent }) => {
      if (!selectedWithMask || !isCreatingFreeformPathMask) {
        return;
      }
      if (event.button !== 0) {
        return;
      }
      if (selectedWithMask.mask.type !== "freeform") {
        return;
      }

      event.stopPropagation();
      const pos = viewport.screenToCanvas({
        clientX: event.clientX,
        clientY: event.clientY,
      });
      if (!pos) {
        return;
      }

      const nextParams = appendPointToFreeformPathMask({
        params: selectedWithMask.mask.params,
        canvasPoint: pos,
        bounds: selectedWithMask.bounds,
      });
      const updatedMask = withUpdatedMaskParams({
        mask: selectedWithMask.mask,
        params: nextParams,
      });

      editor.timeline.updateElements({
        updates: [
          {
            trackId: selectedWithMask.trackId,
            elementId: selectedWithMask.elementId,
            patch: {
              masks: replaceElementMask({
                masks: selectedWithMask.element.masks,
                updatedMask,
              }),
            } as Partial<MaskableElement>,
          },
        ],
      });
    },
    [editor.timeline, isCreatingFreeformPathMask, selectedWithMask, viewport],
  );

  const handlePointerMove = useCallback(
    ({ event }: { event: React.PointerEvent }) => {
      const pendingSegmentInsert = pendingSegmentInsertRef.current;
      if (pendingSegmentInsert && !dragStateRef.current) {
        const distance = Math.hypot(
          event.clientX - pendingSegmentInsert.startClientX,
          event.clientY - pendingSegmentInsert.startClientY,
        );
        if (distance >= SEGMENT_CLICK_DRAG_THRESHOLD_PX) {
          dragStateRef.current = {
            trackId: pendingSegmentInsert.trackId,
            elementId: pendingSegmentInsert.elementId,
            handleId: { kind: "position" },
            startCanvasX: pendingSegmentInsert.startCanvasX,
            startCanvasY: pendingSegmentInsert.startCanvasY,
            startParams: pendingSegmentInsert.startParams,
          };
          pendingSegmentInsertRef.current = null;
          setActiveHandleId({ kind: "position" });
        }
      }

      const drag = dragStateRef.current;
      if (!drag || !selectedWithMask) return;

      const pos = viewport.screenToCanvas({
        clientX: event.clientX,
        clientY: event.clientY,
      });
      if (!pos) return;

      const deltaX = pos.x - drag.startCanvasX;
      const deltaY = pos.y - drag.startCanvasY;
      const def = getMaskDefinition(selectedWithMask.mask.type);

      const rawParams = def.computeParamUpdate({
        handleId: drag.handleId,
        startParams: drag.startParams,
        deltaX,
        deltaY,
        startCanvasX: drag.startCanvasX,
        startCanvasY: drag.startCanvasY,
        bounds: selectedWithMask.bounds,
        canvasSize,
      });
      const proposedParams = { ...drag.startParams, ...rawParams };

      const snapThreshold = viewport.screenPixelsToLogicalThreshold({
        screenPixels: SNAP_THRESHOLD_SCREEN_PIXELS,
      });
      const { params: nextParams, activeLines } = isShiftHeldRef.current
        ? { params: proposedParams, activeLines: [] as SnapLine[] }
        : (def.interaction.snap?.({
            handleId: drag.handleId,
            startParams: drag.startParams,
            proposedParams,
            bounds: selectedWithMask.bounds,
            canvasSize,
            snapThreshold,
          }) ?? { params: proposedParams, activeLines: [] as SnapLine[] });

      onSnapLinesChange?.(activeLines);

      const updatedMask = withUpdatedMaskParams({
        mask: selectedWithMask.mask,
        params: nextParams as typeof selectedWithMask.mask.params,
      });
      editor.timeline.previewElements({
        updates: [
          {
            trackId: drag.trackId,
            elementId: drag.elementId,
            updates: {
              masks: replaceElementMask({
                masks: selectedWithMask.element.masks,
                updatedMask,
              }),
            } as Partial<MaskableElement>,
          },
        ],
      });
    },
    [
      selectedWithMask,
      canvasSize,
      editor,
      isShiftHeldRef,
      onSnapLinesChange,
      viewport,
    ],
  );

  const handlePointerUp = useCallback(() => {
    const pendingSegmentInsert = pendingSegmentInsertRef.current;
    if (pendingSegmentInsert && !dragStateRef.current) {
      editor.timeline.insertFreeformPathMaskPoint({
        trackId: pendingSegmentInsert.trackId,
        elementId: pendingSegmentInsert.elementId,
        maskId: pendingSegmentInsert.maskId,
        segmentIndex: pendingSegmentInsert.segmentIndex,
        canvasPoint: {
          x: pendingSegmentInsert.startCanvasX,
          y: pendingSegmentInsert.startCanvasY,
        },
        bounds: pendingSegmentInsert.bounds,
      });
      clearMaskHandleState();
      releaseCapturedPointer();
      return;
    }

    if (dragStateRef.current) {
      editor.timeline.commitPreview();
      clearMaskHandleState();
    }
    releaseCapturedPointer();
  }, [clearMaskHandleState, editor, releaseCapturedPointer]);

  return {
    selectedWithMask,
    handlePositions,
    overlays,
    isCreatingFreeformPathMask,
    handleCanvasPointerDown,
    activeHandleId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
