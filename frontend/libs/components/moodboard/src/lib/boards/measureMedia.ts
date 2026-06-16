// Probe intrinsic dimensions so masonry can lay an item out before it paints.
// Both resolve (never reject) with a square fallback so a failed probe still
// yields a usable tile.

export const measureImage = (
  url: string,
): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    const img = new window.Image();
    // No crossOrigin: we only read naturalWidth/Height (which never taint a
    // canvas), and forcing anonymous CORS makes non-CORS images fail to load —
    // collapsing them to the 320x320 fallback. palette.ts sets crossOrigin
    // itself, where getImageData actually needs it.
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 320, h: 320 });
    img.src = url;
  });

export const measureVideo = (
  url: string,
): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () =>
      resolve({ w: v.videoWidth || 320, h: v.videoHeight || 320 });
    v.onerror = () => resolve({ w: 320, h: 320 });
    v.src = url;
  });
