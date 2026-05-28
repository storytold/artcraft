"use client";

import { usePreviewViewport } from "./preview-viewport";
import type { SnapLine } from "../preview-snap";

export function SnapGuides({ lines }: { lines: SnapLine[] }) {
  const viewport = usePreviewViewport();

  if (lines.length === 0) {
    return null;
  }

  const toOverlayX = (logicalX: number) =>
    viewport.positionToOverlay({
      positionX: logicalX,
      positionY: 0,
    }).x;

  const toOverlayY = (logicalY: number) =>
    viewport.positionToOverlay({
      positionX: 0,
      positionY: logicalY,
    }).y;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {lines.map((line) => {
        if (line.type === "vertical") {
          return (
            <div
              key={`vertical-${line.position}`}
              className="absolute top-0 bottom-0 w-px bg-white/70"
              style={{ left: toOverlayX(line.position) }}
            />
          );
        }
        return (
          <div
            key={`horizontal-${line.position}`}
            className="absolute left-0 right-0 h-px bg-white/70"
            style={{ top: toOverlayY(line.position) }}
          />
        );
      })}
    </div>
  );
}
