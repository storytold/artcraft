import type { TimelineTrack, MediaAsset } from "../../types";

interface RenderContext {
  tracks: TimelineTrack[];
  currentTime: number;
  canvasWidth: number;
  canvasHeight: number;
  assets: MediaAsset[];
  backgroundColor: string;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private videoElements = new Map<string, HTMLVideoElement>();

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  detach(): void {
    this.videoElements.forEach((video) => {
      video.pause();
      video.src = "";
    });
    this.videoElements.clear();
    this.canvas = null;
    this.ctx = null;
  }

  render(context: RenderContext): void {
    const { ctx, canvas } = this;
    if (!ctx || !canvas) return;

    const { tracks, currentTime, canvasWidth, canvasHeight, assets, backgroundColor } =
      context;

    // Set canvas size if changed
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    // Clear and fill background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Render elements from bottom track to top (painters algorithm)
    for (let i = tracks.length - 1; i >= 0; i--) {
      const track = tracks[i];
      if ("hidden" in track && track.hidden) continue;
      if ("muted" in track && track.muted && track.type === "video") continue;

      for (const element of track.elements) {
        const elEnd = element.startTime + element.duration;
        if (currentTime < element.startTime || currentTime >= elEnd) continue;

        this.renderElement(ctx, element, currentTime, canvasWidth, canvasHeight, assets);
      }
    }
  }

  private renderElement(
    ctx: CanvasRenderingContext2D,
    element: any,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number,
    assets: MediaAsset[],
  ): void {
    ctx.save();

    if ("opacity" in element) {
      ctx.globalAlpha = element.opacity ?? 1;
    }

    if ("transform" in element && element.transform) {
      const { scale, position, rotate } = element.transform;
      ctx.translate(
        canvasWidth / 2 + (position?.x ?? 0),
        canvasHeight / 2 + (position?.y ?? 0),
      );
      if (rotate) ctx.rotate((rotate * Math.PI) / 180);
      if (scale && scale !== 1) ctx.scale(scale, scale);
      ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
    }

    switch (element.type) {
      case "image":
        this.renderImage(ctx, element, canvasWidth, canvasHeight, assets);
        break;
      case "video":
        this.renderVideo(ctx, element, currentTime, canvasWidth, canvasHeight, assets);
        break;
      case "text":
        this.renderText(ctx, element, canvasWidth, canvasHeight);
        break;
    }

    ctx.restore();
  }

  private renderImage(
    ctx: CanvasRenderingContext2D,
    element: any,
    canvasWidth: number,
    canvasHeight: number,
    assets: MediaAsset[],
  ): void {
    const asset = assets.find((a) => a.id === element.mediaId);
    if (!asset?.url) return;

    // Use cached image or load
    const img = new Image();
    img.src = asset.url;
    if (img.complete) {
      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (canvasWidth - w) / 2, (canvasHeight - h) / 2, w, h);
    }
  }

  private renderVideo(
    ctx: CanvasRenderingContext2D,
    element: any,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number,
    assets: MediaAsset[],
  ): void {
    const asset = assets.find((a) => a.id === element.mediaId);
    if (!asset?.url) return;

    let video = this.videoElements.get(element.id);
    if (!video) {
      video = document.createElement("video");
      video.src = asset.url;
      video.muted = true;
      video.preload = "auto";
      this.videoElements.set(element.id, video);
    }

    const localTime = currentTime - element.startTime + (element.trimStart ?? 0);
    if (Math.abs(video.currentTime - localTime) > 0.1) {
      video.currentTime = localTime;
    }

    if (video.readyState >= 2) {
      const scale = Math.min(canvasWidth / video.videoWidth, canvasHeight / video.videoHeight);
      const w = video.videoWidth * scale;
      const h = video.videoHeight * scale;
      ctx.drawImage(video, (canvasWidth - w) / 2, (canvasHeight - h) / 2, w, h);
    }
  }

  private renderText(
    ctx: CanvasRenderingContext2D,
    element: any,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    const fontSize = element.fontSize ?? 48;
    const fontFamily = element.fontFamily ?? "sans-serif";
    const fontWeight = element.fontWeight ?? "normal";
    const fontStyle = element.fontStyle ?? "normal";

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = element.color ?? "#ffffff";
    ctx.textAlign = (element.textAlign as CanvasTextAlign) ?? "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      element.content ?? "",
      canvasWidth / 2,
      canvasHeight / 2,
    );
  }
}
