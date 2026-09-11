const THUMBNAIL_MAX_WIDTH = 1280;
const THUMBNAIL_MAX_HEIGHT = 720;

export function thumbnailSize({
  width,
  height,
}: {
  width: number;
  height: number;
}): { width: number; height: number } {
  const aspectRatio = width / height;
  let targetWidth = width;
  let targetHeight = height;

  if (targetWidth > THUMBNAIL_MAX_WIDTH) {
    targetWidth = THUMBNAIL_MAX_WIDTH;
    targetHeight = Math.round(targetWidth / aspectRatio);
  }
  if (targetHeight > THUMBNAIL_MAX_HEIGHT) {
    targetHeight = THUMBNAIL_MAX_HEIGHT;
    targetWidth = Math.round(targetHeight * aspectRatio);
  }

  return { width: targetWidth, height: targetHeight };
}

export function renderThumbnailDataUrl({
  width,
  height,
  draw,
}: {
  width: number;
  height: number;
  draw: ({
    context,
    width,
    height,
  }: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
  }) => void;
}): string {
  const size = thumbnailSize({ width, height });
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not get canvas context");
  }

  draw({ context, width: size.width, height: size.height });
  return canvas.toDataURL("image/jpeg", 0.8);
}
