import { Vector2d } from "konva/lib/types";

export interface BaseSelectorImage {
  url: string;
  mediaToken: string;
  thumbnailUrlTemplate?: string;
  fullImageUrl?: string;
  isBlankCanvas?: boolean;
  blankCanvasWidth?: number;
  blankCanvasHeight?: number;
}

export interface ImageBundle {
  images: BaseSelectorImage[];
}

export interface DragState extends Vector2d {
  anchorX: number;
  anchorY: number;
}
