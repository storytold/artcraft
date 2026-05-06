import GeneratePipelineWorker from "./generatePipeline.worker.ts?worker&inline";

type CompositeOk = { id: number; ok: true; type: "composite"; blob: Blob };
type MaskOk = { id: number; ok: true; type: "mask"; bytes: Uint8Array };
type WorkerErr = { id: number; ok: false; error: string };
type WorkerResponse = CompositeOk | MaskOk | WorkerErr;

type Pending = {
  resolve: (value: CompositeOk | MaskOk) => void;
  reject: (err: Error) => void;
};

let workerInstance: Worker | null = null;
let nextId = 1;
const pendingRequests = new Map<number, Pending>();

const ensureWorker = (): Worker => {
  if (workerInstance) return workerInstance;
  const worker = new GeneratePipelineWorker();
  worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
    const res = event.data;
    const pending = pendingRequests.get(res.id);
    if (!pending) return;
    pendingRequests.delete(res.id);
    if (res.ok) {
      pending.resolve(res);
    } else {
      pending.reject(new Error(res.error));
    }
  });
  worker.addEventListener("error", (event) => {
    const err = new Error(event.message || "Generate pipeline worker error");
    for (const pending of pendingRequests.values()) {
      pending.reject(err);
    }
    pendingRequests.clear();
  });
  workerInstance = worker;
  return worker;
};

export const compositeInWorker = (params: {
  markerBitmap: ImageBitmap;
  baseBitmap?: ImageBitmap;
  width: number;
  height: number;
}): Promise<Blob> => {
  const worker = ensureWorker();
  const id = nextId++;
  const transfer: Transferable[] = [params.markerBitmap];
  if (params.baseBitmap) transfer.push(params.baseBitmap);
  return new Promise<Blob>((resolve, reject) => {
    pendingRequests.set(id, {
      resolve: (res) => {
        if (res.type !== "composite") {
          reject(new Error("Unexpected response type for composite"));
          return;
        }
        resolve(res.blob);
      },
      reject,
    });
    worker.postMessage({ id, type: "composite", ...params }, transfer);
  });
};

export const maskInWorker = (params: {
  markerBitmap: ImageBitmap;
  width: number;
  height: number;
}): Promise<Uint8Array> => {
  const worker = ensureWorker();
  const id = nextId++;
  return new Promise<Uint8Array>((resolve, reject) => {
    pendingRequests.set(id, {
      resolve: (res) => {
        if (res.type !== "mask") {
          reject(new Error("Unexpected response type for mask"));
          return;
        }
        resolve(res.bytes);
      },
      reject,
    });
    worker.postMessage({ id, type: "mask", ...params }, [params.markerBitmap]);
  });
};
