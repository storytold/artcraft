import {
  signal,
} from "@preact/signals-react";

export type MaybeCanvasRenderBitmapType = ImageBitmap | undefined;

const canvasRenderBitmap = signal<MaybeCanvasRenderBitmapType>(undefined);

export const setCanvasRenderBitmap = (bitmap: ImageBitmap) => {
  canvasRenderBitmap.value = bitmap;
}

export const getCanvasRenderBitmap = () : MaybeCanvasRenderBitmapType => {
  return canvasRenderBitmap.value;
}
