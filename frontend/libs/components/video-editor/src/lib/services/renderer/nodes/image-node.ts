import {
  VisualNode,
  type ResolvedVisualSourceNodeState,
  type VisualNodeParams,
} from "./visual-node";

export interface ImageNodeParams extends VisualNodeParams {
  url: string;
  // Optional original File. When supplied, the loader prefers a
  // same-origin blob: URL minted from it, which guarantees the canvas
  // doesn't end up CORS-tainted on draw — the failure mode behind
  // images rendering as black in the preview. Cross-origin CDN URLs
  // still work via crossOrigin="anonymous" when file is absent.
  file?: File;
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
  file,
  maxSourceSize,
}: {
  url: string;
  file?: File;
  maxSourceSize?: number;
}): Promise<CachedImageSource> {
  const cacheKey = `${url}::${maxSourceSize ?? "full"}`;

  const cached = imageSourceCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async (): Promise<CachedImageSource> => {
    const image = new Image();
    // Prefer a same-origin blob URL minted from the File when the host
    // provided one. Falls back to the resolved URL with explicit CORS
    // so cross-origin CDNs that allow anonymous reads still work.
    let objectUrl: string | null = null;
    if (file) {
      objectUrl = URL.createObjectURL(file);
    } else {
      image.crossOrigin = "anonymous";
    }
    const src = objectUrl ?? url;

    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image load failed"));
        image.src = src;
      });
    } finally {
      // Revoke the blob URL once the browser has the bitmap. The
      // <img> retains its decoded pixels independently of the URL.
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }

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
