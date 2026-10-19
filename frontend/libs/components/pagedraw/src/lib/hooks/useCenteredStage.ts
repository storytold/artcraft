import { useEffect, useState } from "react";
import Konva from "konva";

const MIN_DRAWING_PIXEL_RATIO = 2;
const DRAWING_LAYER_IDS = ["draw-layer", "invis-mask-layer"] as const;

export const useStageCentering = (
  stageRef: React.RefObject<Konva.Stage>,
  leftPct: number,
  leftPanelWidth: number,
  leftPanelHeight: number,
) => {
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      const containerWidth = window.innerWidth * (leftPct / 100);
      const containerHeight = window.innerHeight;

      // Calculate center position
      const centerX = (containerWidth - leftPanelWidth) / 2;
      const centerY = (containerHeight - leftPanelHeight) / 2;

      setStagePosition({ x: centerX, y: centerY });
      stage.position({ x: centerX, y: centerY });
      syncDrawingLayerPixelRatio(stage);
    }
  }, [
    leftPct,
    leftPanelWidth,
    leftPanelHeight,
    window.innerWidth,
    window.innerHeight,
  ]);

  return stagePosition;
};

function syncDrawingLayerPixelRatio(stage: Konva.Stage) {
  // Konva normally matches the display DPR, which is 1 on many desktop
  // displays. Supersample only the vector stroke layers so curved brush and
  // mask edges stay smooth without increasing the backing size of every layer.
  const pixelRatio = Math.max(
    window.devicePixelRatio || 1,
    MIN_DRAWING_PIXEL_RATIO,
  );

  for (const layerId of DRAWING_LAYER_IDS) {
    const layer = stage.findOne<Konva.Layer>(`#${layerId}`);
    if (!layer) continue;

    const canvas = layer.getCanvas();
    if (canvas.getPixelRatio() !== pixelRatio) {
      canvas.setPixelRatio(pixelRatio);
    }
  }

  stage.batchDraw();
}
