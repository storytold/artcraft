import { useCallback, useState } from "react";
import { clampZoom, zoomIn, zoomOut } from "../../lib/timeline/zoom-utils";

export function useTimelineZoom(initialZoom = 1) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((z) => zoomIn(z));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((z) => zoomOut(z));
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(clampZoom(newZoom));
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoomLevel((z) => clampZoom(z * factor));
      } else {
        setScrollLeft((s) => Math.max(0, s + e.deltaX + e.deltaY));
      }
    },
    [],
  );

  return {
    zoomLevel,
    scrollLeft,
    setScrollLeft,
    handleZoomIn,
    handleZoomOut,
    handleZoomChange,
    handleWheel,
  };
}
