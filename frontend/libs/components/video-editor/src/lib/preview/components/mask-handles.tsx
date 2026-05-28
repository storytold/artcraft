"use client";

import { PEN_CURSOR } from "./cursors";
import { usePreviewViewport } from "./preview-viewport";
import { useMaskHandles } from "../../masks/use-mask-handles";
import { maskHandleIdKey, type MaskHandleId } from "../../masks/types";
import type { SnapLine } from "../preview-snap";
import {
  CornerHandle,
  CircleHandle,
  CanvasPathOutline,
  EdgeHandle,
  IconHandle,
  LineOverlay,
  BoundingBoxOutline,
  ShapeOutline,
} from "./handle-primitives";

const CUSTOM_MASK_ANCHOR_SIZE = 7;
import { Rotate01Icon, FeatherIcon } from "@hugeicons/core-free-icons";

export function MaskHandles({
  onSnapLinesChange,
}: {
  onSnapLinesChange?: (lines: SnapLine[]) => void;
}) {
  const viewport = usePreviewViewport();
  const {
    selectedWithMask,
    handlePositions,
    overlays,
    isCreatingFreeformPathMask,
    handleCanvasPointerDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useMaskHandles({ onSnapLinesChange });

  if (!selectedWithMask) return null;

  const toOverlay = ({
    canvasX,
    canvasY,
  }: {
    canvasX: number;
    canvasY: number;
  }) =>
    viewport.canvasToOverlay({
      canvasX,
      canvasY,
    });

  const { x: scaleX, y: scaleY } = viewport.getDisplayScale();
  const canvasOrigin = toOverlay({ canvasX: 0, canvasY: 0 });

  const onPointerMove = (event: React.PointerEvent) => {
    if (viewport.handlePanPointerMove({ event })) {
      return;
    }

    handlePointerMove({ event });
  };
  const onPointerUp = (event: React.PointerEvent) => {
    if (viewport.handlePanPointerUp({ event })) {
      return;
    }

    handlePointerUp();
  };
  const handleMaskPointerDown = ({
    event,
    handleId,
  }: {
    event: React.PointerEvent;
    handleId: MaskHandleId;
  }) => {
    if (viewport.handlePanPointerDown({ event })) {
      return;
    }

    handlePointerDown({ event, handleId });
  };
  const handleCanvasOverlayPointerDown = (event: React.PointerEvent) => {
    if (viewport.handlePanPointerDown({ event })) {
      return;
    }

    handleCanvasPointerDown({ event });
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {isCreatingFreeformPathMask ? (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ cursor: PEN_CURSOR }}
          onPointerDown={handleCanvasOverlayPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      ) : null}
      {overlays.map((overlay) => {
        const overlayHandleId = overlay.handleId;
        const pointerHandlers = overlayHandleId
          ? {
              onPointerDown: (event: React.PointerEvent) =>
                handleMaskPointerDown({ event, handleId: overlayHandleId }),
              onPointerMove,
              onPointerUp,
            }
          : {};

        if (overlay.type === "line") {
          return (
            <LineOverlay
              key={overlay.id}
              cursor={overlay.cursor}
              start={toOverlay({
                canvasX: overlay.start.x,
                canvasY: overlay.start.y,
              })}
              end={toOverlay({
                canvasX: overlay.end.x,
                canvasY: overlay.end.y,
              })}
              {...pointerHandlers}
            />
          );
        }

        if (overlay.type === "rect") {
          return (
            <BoundingBoxOutline
              key={overlay.id}
              center={toOverlay({
                canvasX: overlay.center.x,
                canvasY: overlay.center.y,
              })}
              outlineWidth={overlay.width * scaleX}
              outlineHeight={overlay.height * scaleY}
              rotation={overlay.rotation}
              cursor={overlay.cursor}
              dashed={overlay.dashed}
              {...pointerHandlers}
            />
          );
        }

        if (overlay.type === "shape") {
          return (
            <ShapeOutline
              key={overlay.id}
              center={toOverlay({
                canvasX: overlay.center.x,
                canvasY: overlay.center.y,
              })}
              outlineWidth={overlay.width * scaleX}
              outlineHeight={overlay.height * scaleY}
              rotation={overlay.rotation}
              pathData={overlay.pathData}
              cursor={overlay.cursor}
              {...pointerHandlers}
            />
          );
        }

        if (overlay.type === "canvas-path") {
          return (
            <CanvasPathOutline
              key={overlay.id}
              pathData={overlay.pathData}
              translateX={
                overlay.coordinateSpace === "canvas" ? canvasOrigin.x : 0
              }
              translateY={
                overlay.coordinateSpace === "canvas" ? canvasOrigin.y : 0
              }
              scaleX={overlay.coordinateSpace === "canvas" ? scaleX : 1}
              scaleY={overlay.coordinateSpace === "canvas" ? scaleY : 1}
              cursor={overlay.cursor}
              strokeWidth={overlay.strokeWidth}
              strokeOpacity={overlay.strokeOpacity}
              {...pointerHandlers}
            />
          );
        }

        return null;
      })}
      {handlePositions.map((handle) => {
        const screen = toOverlay({ canvasX: handle.x, canvasY: handle.y });
        const key = maskHandleIdKey({ id: handle.id });

        if (handle.kind === "icon" && handle.icon === "rotate") {
          return (
            <IconHandle
              key={key}
              icon={Rotate01Icon}
              screen={screen}
              onPointerDown={(event) =>
                handleMaskPointerDown({ event, handleId: handle.id })
              }
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          );
        }

        if (handle.kind === "icon" && handle.icon === "feather") {
          return (
            <IconHandle
              key={key}
              icon={FeatherIcon}
              screen={screen}
              onPointerDown={(event) =>
                handleMaskPointerDown({ event, handleId: handle.id })
              }
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          );
        }

        if (handle.kind === "edge" && handle.edgeAxis === "horizontal") {
          return (
            <EdgeHandle
              key={key}
              edge="right"
              screen={screen}
              rotation={handle.rotation ?? 0}
              onPointerDown={(event) =>
                handleMaskPointerDown({ event, handleId: handle.id })
              }
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          );
        }

        if (handle.kind === "edge" && handle.edgeAxis === "vertical") {
          return (
            <EdgeHandle
              key={key}
              edge="bottom"
              screen={screen}
              rotation={handle.rotation ?? 0}
              onPointerDown={(event) =>
                handleMaskPointerDown({ event, handleId: handle.id })
              }
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          );
        }

      if (handle.kind === "point") {
        return (
          <CircleHandle
            key={key}
            screen={screen}
            size={CUSTOM_MASK_ANCHOR_SIZE}
            isSelected={handle.isSelected}
            onPointerDown={(event) =>
              handleMaskPointerDown({ event, handleId: handle.id })
            }
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        );
      }

        if (handle.kind === "corner") {
          return (
            <CornerHandle
              key={key}
              screen={screen}
              onPointerDown={(event) =>
                handleMaskPointerDown({ event, handleId: handle.id })
              }
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          );
        }

        return (
          <CornerHandle
            key={key}
            cursor={handle.cursor}
            screen={screen}
            onPointerDown={(event) =>
              handleMaskPointerDown({ event, handleId: handle.id })
            }
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        );
      })}
    </div>
  );
}

export type { MaskHandleId };
