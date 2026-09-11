import { useState, useEffect } from 'react';
import Konva from 'konva';

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

    return stagePosition;
  };