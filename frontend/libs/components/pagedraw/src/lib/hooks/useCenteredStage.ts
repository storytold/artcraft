import { useState, useEffect } from 'react';
import Konva from 'konva';

const MIN_DRAWING_PIXEL_RATIO = 2;
const DRAWING_LAYER_IDS = ['draw-layer', 'invis-mask-layer'] as const;

function syncDrawingLayerPixelRatio(stage: Konva.Stage) {
    const pixelRatio = Math.max(window.devicePixelRatio || 1, MIN_DRAWING_PIXEL_RATIO);
    let changed = false;

    for (const layerId of DRAWING_LAYER_IDS) {
      const layer = stage.findOne<Konva.Layer>(`#${layerId}`);
      if (!layer) continue;

      const canvas = layer.getCanvas();
      if (canvas.getPixelRatio() !== pixelRatio) {
        canvas.setPixelRatio(pixelRatio);
        changed = true;
      }
    }

    if (changed) {
      stage.batchDraw();
    }
  }

export const useStageCentering = (
    stageRef: React.RefObject<Konva.Stage>,
    leftPct: number,
    leftPanelWidth: number,
    leftPanelHeight: number
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
      }
    }, [leftPct, leftPanelWidth, leftPanelHeight, window.innerWidth, window.innerHeight]);

    // Keep vector stroke layers supersampled independently from stage centering.
    // Browser zoom and moving the window between displays can change the DPR.
    useEffect(() => {
      const syncPixelRatio = () => {
        const stage = stageRef.current;
        if (stage) {
          syncDrawingLayerPixelRatio(stage);
        }
      };

      syncPixelRatio();
      window.addEventListener('resize', syncPixelRatio);
      return () => window.removeEventListener('resize', syncPixelRatio);
    }, [stageRef]);

    return stagePosition;
  };