import { useCallback, useRef, useMemo } from "react";
import { useBoxSelect } from "../../../selection/hooks/use-box-select";
import {
  useKeyframeSelection,
  getSelectedKeyframeId,
} from "./use-keyframe-selection";
import type { SelectedKeyframeRef, ElementKeyframe } from "../../../animation/types";
import type { ExpandedRow } from "../../components/expanded-layout";
import { timelineTimeToSnappedPixels } from "../../pixel-utils";
import {
  KEYFRAME_LANE_HEIGHT_PX,
  KEYFRAME_DIAMOND_SIZE_PX,
} from "../../components/layout";

export function useKeyframeBoxSelect({
  trackId,
  elementId,
  rows,
  keyframes,
  displayedStartTime,
  zoomLevel,
  elementLeft,
}: {
  trackId: string;
  elementId: string;
  rows: ExpandedRow[];
  keyframes: ElementKeyframe[];
  displayedStartTime: number;
  zoomLevel: number;
  elementLeft: number;
}) {
  const {
    selectedKeyframes,
    keyframeSelectionAnchor,
    setKeyframeSelection,
    clearKeyframeSelection,
  } = useKeyframeSelection();

  const containerRef = useRef<HTMLDivElement>(null);
  const initialKeyframesRef = useRef<SelectedKeyframeRef[]>([]);

  const keyframeEntries = useMemo(() => {
    const entries: Array<{
      id: string;
      ref: SelectedKeyframeRef;
      rowIndex: number;
      offsetPx: number;
    }> = [];

    for (const kf of keyframes) {
      const rowIndex = rows.findIndex(
        (r) => r.propertyPath === kf.propertyPath,
      );
      if (rowIndex === -1) continue;

      const ref: SelectedKeyframeRef = {
        trackId,
        elementId,
        propertyPath: kf.propertyPath,
        keyframeId: kf.id,
      };

      const kfLeft = timelineTimeToSnappedPixels({
        time: displayedStartTime + kf.time,
        zoomLevel,
      });

      entries.push({
        id: getSelectedKeyframeId({ keyframe: ref }),
        ref,
        rowIndex,
        offsetPx: kfLeft - elementLeft,
      });
    }

    return entries;
  }, [
    keyframes,
    rows,
    trackId,
    elementId,
    displayedStartTime,
    zoomLevel,
    elementLeft,
  ]);

  const idToRefMap = useMemo(() => {
    const map = new Map<string, SelectedKeyframeRef>();
    for (const entry of keyframeEntries) {
      map.set(entry.id, entry.ref);
    }
    return map;
  }, [keyframeEntries]);

  const selectedIds = useMemo(
    () =>
      selectedKeyframes.map((keyframe) => getSelectedKeyframeId({ keyframe })),
    [selectedKeyframes],
  );

  const anchorId = useMemo(
    () =>
      keyframeSelectionAnchor
        ? getSelectedKeyframeId({ keyframe: keyframeSelectionAnchor })
        : null,
    [keyframeSelectionAnchor],
  );

  const resolveIntersections = useCallback(
    ({
      startPos,
      currentPos,
    }: {
      startPos: { x: number; y: number };
      currentPos: { x: number; y: number };
    }) => {
      const container = containerRef.current;
      if (!container) return [];

      const containerRect = container.getBoundingClientRect();

      const sx = startPos.x - containerRect.left;
      const sy = startPos.y - containerRect.top;
      const cx = currentPos.x - containerRect.left;
      const cy = currentPos.y - containerRect.top;

      const selLeft = Math.min(sx, cx);
      const selTop = Math.min(sy, cy);
      const selRight = Math.max(sx, cx);
      const selBottom = Math.max(sy, cy);

      const halfHit = KEYFRAME_DIAMOND_SIZE_PX / 2;

      return keyframeEntries
        .filter((entry) => {
          const kfX = entry.offsetPx;
          const kfY =
            entry.rowIndex * KEYFRAME_LANE_HEIGHT_PX +
            KEYFRAME_LANE_HEIGHT_PX / 2;

          return !(
            kfX + halfHit < selLeft ||
            kfX - halfHit > selRight ||
            kfY + halfHit < selTop ||
            kfY - halfHit > selBottom
          );
        })
        .map((entry) => entry.id);
    },
    [keyframeEntries],
  );

  const onSelectionChange = useCallback(
    ({
      intersectedIds,
      isAdditive,
    }: {
      intersectedIds: string[];
      initialSelectedIds: string[];
      initialAnchorId: string | null;
      isAdditive: boolean;
    }) => {
      const intersectedRefs = intersectedIds
        .map((id) => idToRefMap.get(id))
        .filter((ref): ref is SelectedKeyframeRef => ref != null);

      if (isAdditive) {
        setKeyframeSelection({
          keyframes: [...initialKeyframesRef.current, ...intersectedRefs],
        });
      } else {
        setKeyframeSelection({ keyframes: intersectedRefs });
      }
    },
    [idToRefMap, setKeyframeSelection],
  );

  const {
    selectionBox,
    handleMouseDown: boxSelectMouseDown,
    isSelecting,
    shouldIgnoreClick,
  } = useBoxSelect<string>({
    containerRef,
    resolveIntersections,
    selectedIds,
    anchorId,
    onSelectionChange,
  });

  const handleExpandedAreaMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      initialKeyframesRef.current = selectedKeyframes;
      boxSelectMouseDown(event);
    },
    [boxSelectMouseDown, selectedKeyframes],
  );

  const handleExpandedAreaClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (shouldIgnoreClick()) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      clearKeyframeSelection();
    },
    [shouldIgnoreClick, clearKeyframeSelection],
  );

  return {
    containerRef,
    selectionBox,
    isBoxSelecting: isSelecting,
    handleExpandedAreaMouseDown,
    handleExpandedAreaClick,
  };
}
