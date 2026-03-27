import { useState, useEffect } from "react";
import Konva from "konva";
import { BG_LAYER_ID, DRAW_LAYER_ID } from "../PaintSurface";

export const captureStageEditsBitmap = async (
  stageRef: React.RefObject<Konva.Stage>,
  transformerRefs: React.RefObject<{ [key: string]: Konva.Transformer }>,
  width: number = 1024,
  height: number = 1024,
): Promise<ImageBitmap | undefined> => {
  if (!stageRef.current) {
    return undefined;
  }

  const oldPos = { ...stageRef.current.position() };
  const oldScale = {
    x: stageRef.current.scaleX(),
    y: stageRef.current.scaleY(),
  };

  // Hide all transformers
  Object.values(transformerRefs.current || {}).forEach(
    (transformer: Konva.Transformer) => {
      transformer.visible(false);
    },
  );

  // Disable all the layers that we don't need
  // We only need the base image layer and the edits layer
  stageRef.current.getLayers().forEach((layer) => {
    if (layer.id() == BG_LAYER_ID || layer.id() == DRAW_LAYER_ID) {
      layer.visible(true);
    } else {
      layer.visible(false);
    }
  });

  stageRef.current.position({ x: 0, y: 0 });
  stageRef.current.scale({ x: 1, y: 1 });
  stageRef.current.draw();

  try {
    const canvas = stageRef.current.toCanvas({
      width,
      height,
      pixelRatio: 1,
    });

    return await createImageBitmap(canvas);
  } catch (error) {
    console.error("Failed to create ImageBitmap:", error);
    return undefined;
  } finally {
    // Restore transformers
    Object.values(transformerRefs.current || {}).forEach(
      (transformer: Konva.Transformer) => {
        transformer.visible(true);
      },
    );

    // Restore all layers visibility
    stageRef.current.getLayers().forEach((layer) => {
      layer.visible(true);
    });

    stageRef.current.position(oldPos);
    stageRef.current.scale(oldScale);
    stageRef.current.draw();
  }
};

export const useStageSnapshot = (
  stageRef: React.RefObject<Konva.Stage>,
  imageRef: React.RefObject<Konva.Image>,
  isSelectingRef: React.RefObject<boolean>,
  transformerRefs: React.RefObject<{ [key: string]: Konva.Transformer }>,
) => {
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  const captureStageImage = (
    stageRef: React.RefObject<Konva.Stage>,
    width: number = 1024,
    height: number = 1024,
  ): string => {
    if (!stageRef.current) return "";

    const oldPos = { ...stageRef.current.position() };
    const oldScale = {
      x: stageRef.current.scaleX(),
      y: stageRef.current.scaleY(),
    };

    // Hide all transformers
    Object.values(transformerRefs.current || {}).forEach(
      (transformer: Konva.Transformer) => {
        transformer.visible(false);
      },
    );

    stageRef.current.position({ x: 0, y: 0 });
    stageRef.current.scale({ x: 1, y: 1 });
    stageRef.current.draw();
    const uri = stageRef.current.toDataURL({ width, height, pixelRatio: 1 });

    // Restore transformers
    Object.values(transformerRefs.current || {}).forEach(
      (transformer: Konva.Transformer) => {
        transformer.visible(true);
      },
    );

    stageRef.current.position(oldPos);
    stageRef.current.scale(oldScale);
    stageRef.current.draw();
    return uri;
  };

  useEffect(() => {
    const updateSnapshot = () => {
      if (!isSelectingRef.current && stageRef.current && imageRef.current) {
        const uri = captureStageImage(stageRef);
        if (uri) {
          const img = new window.Image();
          img.onload = () => {
            imageRef.current?.setAttrs({
              image: img,
            });
          };
          img.src = uri;
        }
      }
      const frameId = requestAnimationFrame(updateSnapshot);
      setAnimationFrameId(frameId);
    };

    const frameId = requestAnimationFrame(updateSnapshot);
    setAnimationFrameId(frameId);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
};
