import { useState, useLayoutEffect } from "react";

export const useRightPanelLayoutManagement = (
  rightContainerRef: React.RefObject<HTMLDivElement | null>,
  naturalWidth: number,
  naturalHeight: number,
  leftPct: number,
  onCanvasSizeChange?: (width: number, height: number) => void,
) => {
  const [previewScale, setPreviewScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      if (!rightContainerRef.current) return;
      const { clientWidth, clientHeight } = rightContainerRef.current;
      let s = Math.min(
        clientWidth / naturalWidth,
        clientHeight / naturalHeight,
      );
      if (s > 1.0) {
        s = 1.0;
      }
      setPreviewScale(s);
      onCanvasSizeChange?.(clientWidth, clientHeight);
    };
    update(); // run once
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftPct]);

  return previewScale;
};
