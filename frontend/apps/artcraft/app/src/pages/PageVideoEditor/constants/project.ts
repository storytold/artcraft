import type { TCanvasSize } from "../types";

export const DEFAULT_FPS = 30;

export const DEFAULT_CANVAS_SIZE: TCanvasSize = {
  width: 1920,
  height: 1080,
};

export const CANVAS_PRESETS: Array<TCanvasSize & { label: string }> = [
  { width: 1920, height: 1080, label: "1080p (16:9)" },
  { width: 1080, height: 1920, label: "Vertical (9:16)" },
  { width: 1080, height: 1080, label: "Square (1:1)" },
  { width: 3840, height: 2160, label: "4K (16:9)" },
];
