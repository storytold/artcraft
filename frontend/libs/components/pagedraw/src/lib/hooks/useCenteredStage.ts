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

    // At 1x DPR, 2x supersampling means 4x backing-store pixels per layer.
    // For an RGBA scene canvas that is 16 bytes per CSS pixel: about 31.6 MiB
    // at 1920x1080 or 126.6 MiB at 3840x2160 per affected layer, before
    // browser/Konva overhead. Keep that cost limited to the two vector stroke
    // layers and redraw only when their effective pixel ratio actually changed.
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

      let resolutionQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      const handleDprChange = () => {
        syncPixelRatio();
        // The old resolution query stops matching after a DPR transition.
        // Re-arm it for the new DPR so later monitor/zoom changes are observed.
        resolutionQuery.removeEventListener('change', handleDprChange);
        resolutionQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        resolutionQuery.addEventListener('change', handleDprChange);
      };

      syncPixelRatio();
      resolutionQuery.addEventListener('change', handleDprChange);
      window.addEventListener('resize', syncPixelRatio);

      return () => {
        window.removeEventListener('resize', syncPixelRatio);
        resolutionQuery.removeEventListener('change', handleDprChange);
      };
    }, [stageRef]);

    return stagePosition;
  };
