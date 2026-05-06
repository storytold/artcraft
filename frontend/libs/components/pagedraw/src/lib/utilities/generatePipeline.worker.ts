/// <reference lib="webworker" />

type WorkerRequest =
  | {
      id: number;
      type: "setBase";
      baseBitmap?: ImageBitmap;
    }
  | {
      id: number;
      type: "composite";
      markerBitmap: ImageBitmap;
      width: number;
      height: number;
    }
  | {
      id: number;
      type: "mask";
      markerBitmap: ImageBitmap;
      width: number;
      height: number;
    };

type WorkerResponse =
  | { id: number; ok: true; type: "setBase" }
  | { id: number; ok: true; type: "composite"; blob: Blob }
  | { id: number; ok: true; type: "mask"; bytes: Uint8Array }
  | { id: number; ok: false; error: string };

// The base image rarely changes (only when the user picks a new starting image
// or lands on a generation result). Caching it here avoids cloning + transferring
// it on every Generate click.
let cachedBaseBitmap: ImageBitmap | null = null;

const ctxOf = (canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D => {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get OffscreenCanvas 2d context");
  return ctx;
};

const post = (response: WorkerResponse, transfer: Transferable[] = []) => {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(
    response,
    transfer,
  );
};

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    if (req.type === "setBase") {
      cachedBaseBitmap?.close();
      cachedBaseBitmap = req.baseBitmap ?? null;
      post({ id: req.id, ok: true, type: "setBase" });
    } else if (req.type === "composite") {
      const canvas = new OffscreenCanvas(req.width, req.height);
      const ctx = ctxOf(canvas);
      if (cachedBaseBitmap) {
        ctx.drawImage(cachedBaseBitmap, 0, 0, req.width, req.height);
      } else {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, req.width, req.height);
      }
      ctx.drawImage(req.markerBitmap, 0, 0, req.width, req.height);
      req.markerBitmap.close();
      const blob = await canvas.convertToBlob({ type: "image/png" });
      post({ id: req.id, ok: true, type: "composite", blob });
    } else if (req.type === "mask") {
      const canvas = new OffscreenCanvas(req.width, req.height);
      const ctx = ctxOf(canvas);
      ctx.drawImage(req.markerBitmap, 0, 0, req.width, req.height);
      req.markerBitmap.close();
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      post({ id: req.id, ok: true, type: "mask", bytes }, [bytes.buffer]);
    }
  } catch (err) {
    post({
      id: req.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export {};
