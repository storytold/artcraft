"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BoxSelectionSnapshot,
  ResolveIntersections,
  SelectionBoxBounds,
} from "../types";

interface SelectionBoxState<TId> extends BoxSelectionSnapshot<TId> {
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  bounds: SelectionBoxBounds | null;
  isActive: boolean;
  isAdditive: boolean;
}

function getSelectionBoxBounds({
  container,
  startPos,
  currentPos,
}: {
  container: HTMLElement;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
}): SelectionBoxBounds {
  const containerRect = container.getBoundingClientRect();
  const startX = startPos.x - containerRect.left;
  const startY = startPos.y - containerRect.top;
  const currentX = currentPos.x - containerRect.left;
  const currentY = currentPos.y - containerRect.top;

  return {
    left: Math.min(startX, currentX),
    top: Math.min(startY, currentY),
    width: Math.abs(currentX - startX),
    height: Math.abs(currentY - startY),
  };
}

export function useBoxSelect<TId>({
  containerRef,
  resolveIntersections,
  selectedIds,
  anchorId,
  onSelectionChange,
  shouldStartSelection,
  getIsAdditiveSelection,
  isEnabled = true,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  resolveIntersections: ResolveIntersections<TId>;
  selectedIds: TId[];
  anchorId: TId | null;
  onSelectionChange: (state: {
    intersectedIds: TId[];
    initialSelectedIds: TId[];
    initialAnchorId: TId | null;
    isAdditive: boolean;
  }) => void;
  shouldStartSelection?: (event: React.MouseEvent<Element>) => boolean;
  getIsAdditiveSelection?: (event: React.MouseEvent<Element>) => boolean;
  isEnabled?: boolean;
}) {
  const [selectionBox, setSelectionBox] =
    useState<SelectionBoxState<TId> | null>(null);
  const justFinishedSelectingRef = useRef(false);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<Element>) => {
      const canStartSelection = shouldStartSelection
        ? shouldStartSelection(event)
        : true;
      if (!isEnabled || event.button !== 0 || !canStartSelection) {
        return;
      }

      const startPos = { x: event.clientX, y: event.clientY };
      const container = containerRef.current;
      setSelectionBox({
        startPos,
        currentPos: startPos,
        bounds: container
          ? getSelectionBoxBounds({
              container,
              startPos,
              currentPos: startPos,
            })
          : null,
        isActive: false,
        isAdditive: getIsAdditiveSelection
          ? getIsAdditiveSelection(event)
          : event.ctrlKey || event.metaKey,
        initialSelectedIds: selectedIds,
        initialAnchorId: anchorId,
      });
    },
    [
      anchorId,
      containerRef,
      getIsAdditiveSelection,
      isEnabled,
      selectedIds,
      shouldStartSelection,
    ],
  );

  const updateSelection = useCallback(
    ({
      startPos,
      currentPos,
      isAdditive,
      initialSelectedIds,
      initialAnchorId,
    }: SelectionBoxState<TId>) => {
      const intersectedIds = resolveIntersections({
        startPos,
        currentPos,
      });
      onSelectionChange({
        intersectedIds,
        initialSelectedIds,
        initialAnchorId,
        isAdditive,
      });
    },
    [onSelectionChange, resolveIntersections],
  );

  useEffect(() => {
    if (!selectionBox) {
      return;
    }

    const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
      const currentPos = { x: clientX, y: clientY };
      const deltaX = Math.abs(clientX - selectionBox.startPos.x);
      const deltaY = Math.abs(clientY - selectionBox.startPos.y);
      const container = containerRef.current;
      const nextSelectionBox = {
        ...selectionBox,
        currentPos,
        bounds: container
          ? getSelectionBoxBounds({
              container,
              startPos: selectionBox.startPos,
              currentPos,
            })
          : null,
        isActive: deltaX > 5 || deltaY > 5 || selectionBox.isActive,
      };

      setSelectionBox(nextSelectionBox);

      if (!nextSelectionBox.isActive) {
        return;
      }

      updateSelection(nextSelectionBox);
    };

    const handleMouseUp = () => {
      if (selectionBox.isActive) {
        justFinishedSelectingRef.current = true;
        requestAnimationFrame(() => {
          justFinishedSelectingRef.current = false;
        });
      }

      setSelectionBox(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerRef, selectionBox, updateSelection]);

  useEffect(() => {
    if (!selectionBox) {
      return;
    }

    const container = containerRef.current;
    const previousBodyUserSelect = document.body.style.userSelect;
    const previousContainerUserSelect = container?.style.userSelect ?? "";

    document.body.style.userSelect = "none";
    if (container) {
      container.style.userSelect = "none";
    }

    return () => {
      document.body.style.userSelect = previousBodyUserSelect;
      if (container) {
        container.style.userSelect = previousContainerUserSelect;
      }
    };
  }, [containerRef, selectionBox]);

  const shouldIgnoreClick = useCallback(() => {
    return justFinishedSelectingRef.current;
  }, []);

  return {
    selectionBox:
      selectionBox?.isActive && selectionBox.bounds
        ? { bounds: selectionBox.bounds }
        : null,
    handleMouseDown,
    isSelecting: selectionBox?.isActive ?? false,
    shouldIgnoreClick,
  };
}
