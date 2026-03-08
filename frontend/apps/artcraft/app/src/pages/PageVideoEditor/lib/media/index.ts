export function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
      const el = document.createElement(
        file.type.startsWith("video/") ? "video" : "audio",
      );
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        resolve(isFinite(el.duration) ? el.duration : 5);
        URL.revokeObjectURL(el.src);
      };
      el.onerror = () => {
        resolve(5);
        URL.revokeObjectURL(el.src);
      };
      el.src = URL.createObjectURL(file);
    } else {
      // Images default to 5 seconds
      resolve(5);
    }
  });
}

export function createVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      resolve(thumbnailUrl);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
  });
}

export function createImageThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext("2d")!;
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height,
      );
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      resolve(thumbnailUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    img.src = url;
  });
}
