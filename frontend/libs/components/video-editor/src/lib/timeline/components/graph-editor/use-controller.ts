"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "../../../editor/use-editor";
import { registerCanceller } from "../../../editor/cancel-interaction";
import type { NormalizedCubicBezier } from "../../../animation/types";
import { useKeyframeSelection } from "../../hooks/element/use-keyframe-selection";
import {
  applyGraphEditorCurvePreview,
  buildGraphEditorCurvePatches,
  resolveGraphEditorSelectionState,
  type GraphEditorSelectionState,
} from "./session";

export function useGraphEditorController() {
  const editor = useEditor();
  const renderTracks = useEditor(
    (currentEditor) =>
      currentEditor.timeline.getPreviewTracks() ??
      currentEditor.scenes.getActiveScene().tracks,
  );
  const { selectedKeyframes } = useKeyframeSelection();
  const [open, setOpen] = useState(false);
  const [activeComponentKey, setActiveComponentKey] = useState<string | null>(
    null,
  );
  const hasPreviewRef = useRef(false);

  const state = useMemo<GraphEditorSelectionState>(
    () =>
      resolveGraphEditorSelectionState({
        tracks: renderTracks,
        selectedKeyframes,
        preferredComponentKey: activeComponentKey,
      }),
    [activeComponentKey, renderTracks, selectedKeyframes],
  );

  const stateKey =
    state.status === "ready"
      ? `${state.trackId}:${state.elementId}:${state.activeComponentKey}:${state.segments
          .map(
            (segment) =>
              `${segment.propertyPath}:${segment.keyframeId}:${segment.context.componentKey}`,
          )
          .join("|")}`
      : `${state.status}:${state.reason}:${state.activeComponentKey ?? "none"}`;
  const previousStateKeyRef = useRef(stateKey);

  const discardPreview = useCallback(() => {
    if (!hasPreviewRef.current) {
      return;
    }

    editor.timeline.discardPreview();
    hasPreviewRef.current = false;
  }, [editor]);

  useEffect(() => {
    if (hasPreviewRef.current && previousStateKeyRef.current !== stateKey) {
      discardPreview();
    }

    previousStateKeyRef.current = stateKey;
  }, [discardPreview, stateKey]);

  useEffect(() => {
    if (!open) {
      return;
    }

    return registerCanceller({
      fn: () => {
        discardPreview();
        setOpen(false);
      },
    });
  }, [discardPreview, open]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        discardPreview();
      }

      setOpen(nextOpen);
    },
    [discardPreview],
  );

  const handleActiveComponentKeyChange = useCallback(
    (nextComponentKey: string) => {
      discardPreview();
      setActiveComponentKey(nextComponentKey);
    },
    [discardPreview],
  );

  const handlePreviewValue = useCallback(
    (nextValue: NormalizedCubicBezier) => {
      if (state.status !== "ready") {
        return;
      }

      const nextAnimations = state.segments.reduce(
        (animations, segment) =>
          segment.allContexts.reduce(
            (nextAnimationsForSegment, context) =>
              applyGraphEditorCurvePreview({
                animations: nextAnimationsForSegment,
                context,
                cubicBezier: nextValue,
                referenceSpanValue: segment.referenceSpanValue,
              }),
            animations,
          ),
        state.element.animations,
      );
      editor.timeline.previewElements({
        updates: [
          {
            trackId: state.trackId,
            elementId: state.elementId,
            updates: { animations: nextAnimations },
          },
        ],
      });
      hasPreviewRef.current = true;
    },
    [editor, state],
  );

  const handleCommitValue = useCallback(
    (nextValue: NormalizedCubicBezier) => {
      if (state.status !== "ready") {
        return;
      }

      editor.timeline.updateKeyframeCurves({
        keyframes: state.segments.flatMap((segment) => {
          const patches = buildGraphEditorCurvePatches({
            context: segment.context,
            cubicBezier: nextValue,
            referenceSpanValue: segment.referenceSpanValue,
          });
          if (!patches) {
            return [];
          }

          return segment.allContexts.flatMap((context) =>
            patches.map(({ keyframeId, patch }) => ({
              trackId: state.trackId,
              elementId: state.elementId,
              propertyPath: segment.propertyPath,
              componentKey: context.componentKey,
              keyframeId,
              patch,
            })),
          );
        }),
      });
      hasPreviewRef.current = false;
    },
    [editor, state],
  );

  return {
    open,
    onOpenChange: handleOpenChange,
    canOpen: state.status === "ready",
    tooltip: state.status === "ready" ? "Open graph editor" : state.message,
    state,
    onActiveComponentKeyChange: handleActiveComponentKeyChange,
    onPreviewValue: handlePreviewValue,
    onCommitValue: handleCommitValue,
    onCancelPreview: discardPreview,
  };
}
