import {
  VisualNode,
  type ResolvedVisualSourceNodeState,
  type VisualNodeParams,
} from "./visual-node";

export interface ImageNodeParams extends VisualNodeParams {
  url: string;
  maxSourceSize?: number;
}

export interface CachedImageSource {
  source: HTMLImageElement | OffscreenCanvas;
  width: number;
  height: number;
}

const imageSourceCache = new Map<string, Promise<CachedImageSource>>();

export function loadImageSource({
  url,
  maxSourceSize,
}: {
  url: string;
  maxSourceSize?: number;
}): Promise<CachedImageSource> {
  const cacheKey = `${url}::${maxSourceSize ?? "full"}`;

  const cached = imageSourceCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async (): Promise<CachedImageSource> => {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image load failed"));
      image.src = url;
    });

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const exceedsLimit =
      maxSourceSize &&
      (naturalWidth > maxSourceSize || naturalHeight > maxSourceSize);

    if (exceedsLimit) {
      const scale = Math.min(
        maxSourceSize / naturalWidth,
        maxSourceSize / naturalHeight,
      );
      const scaledWidth = Math.round(naturalWidth * scale);
      const scaledHeight = Math.round(naturalHeight * scale);

      const offscreen = new OffscreenCanvas(scaledWidth, scaledHeight);
      const ctx = offscreen.getContext("2d");

      if (ctx) {
        ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
        return { source: offscreen, width: scaledWidth, height: scaledHeight };
      }
    }

    return { source: image, width: naturalWidth, height: naturalHeight };
  })();

  imageSourceCache.set(cacheKey, promise);
  return promise;
}

export class ImageNode extends VisualNode<
  ImageNodeParams,
  ResolvedVisualSourceNodeState
> {}
