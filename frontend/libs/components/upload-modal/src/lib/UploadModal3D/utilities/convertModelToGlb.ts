import {
  ConvertibleModelExtension,
  convertModelBufferToGlb,
  getConvertibleModelExtension,
} from "./modelToGlb";
// `?worker&inline` (see src/vite-env.d.ts): the worker is bundled as
// self-contained inline code inside this library's output. The
// `new Worker(new URL(...), import.meta.url)` form breaks CONSUMING builds —
// the lib build rewrites it to a hashed asset path in dist/index.js, which
// the consumer's vite (worker-import-meta-url plugin) then fails to resolve
// as an entry module.
import ConvertModelToGlbWorker from "./convertModelToGlb.worker?worker&inline";

// Convert an FBX (e.g. a Mixamo download), OBJ, STL or PLY mesh to a binary
// GLB. FBX skeletal animation clips are preserved. Everything downstream of
// the picker — the preview canvas, the backend asset, the scene loader, the
// timeline clip loader, Viewer3D — is GLTF-only, so other formats are
// normalized here once instead of teaching a new loader to every consumer
// (parsing lives in modelToGlb.ts).
//
// The parse + export are synchronous CPU work, so they run in a Web Worker
// (convertModelToGlb.worker.ts) to keep the UI responsive; the worker handles
// jobs one at a time, which also stops a multi-file pick from
// oversubscribing cores. If the worker can't start (bundler/environment),
// conversion falls back to the main thread — same result, just jankier.
//
// Caveats (fine for the current use cases, revisit if needed):
// - Embedded/relative-path textures may not survive (OBJ .mtl files are not
//   read); geometry, vertex colors, skeleton and clips do.
// - Units and up axis are exported as parsed (Mixamo rigs are cm-scaled,
//   STL/PLY are often mm-scaled and Z-up); no rescaling is applied here.
export async function convertModelToGlb(file: File): Promise<File> {
  const ext = getConvertibleModelExtension(file.name);
  if (!ext) throw new Error(`Unsupported model format: ${file.name}`);
  const stem = file.name.slice(0, file.name.lastIndexOf("."));
  const glb = await convert(file, ext, stem);
  return new File([glb], `${stem}.glb`, { type: "model/gltf-binary" });
}

// Files that must go through convertModelToGlb before preview/upload.
export function isConvertibleModelFile(file: File): boolean {
  return getConvertibleModelExtension(file.name) !== null;
}

// ─── worker plumbing ──────────────────────────────────────────────────────

// Signals "the worker itself is broken" (script failed to load/crash), as
// opposed to a legitimate conversion failure of one file — only the former
// falls back to the main thread.
class WorkerUnavailableError extends Error {}

interface PendingJob {
  resolve: (glb: ArrayBuffer) => void;
  reject: (error: Error) => void;
}

// undefined = not attempted yet; null = unavailable (fall back permanently).
let worker: Worker | null | undefined;
let nextJobId = 0;
const pendingJobs = new Map<number, PendingJob>();

async function convert(
  file: File,
  ext: ConvertibleModelExtension,
  name: string,
): Promise<ArrayBuffer> {
  const workerInstance = getWorker();
  if (workerInstance) {
    try {
      // The buffer is transferred (detached) to the worker, so the fallback
      // below re-reads it from the File.
      return await convertInWorker(
        workerInstance,
        await file.arrayBuffer(),
        ext,
        name,
      );
    } catch (error) {
      if (!(error instanceof WorkerUnavailableError)) throw error;
    }
  }
  return convertModelBufferToGlb(await file.arrayBuffer(), ext, name);
}

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  if (typeof Worker === "undefined") {
    worker = null;
    return worker;
  }
  try {
    worker = new ConvertModelToGlbWorker();
    worker.onmessage = (event) => {
      const data = event.data as
        | { id: number; ok: true; glb: ArrayBuffer }
        | { id: number; ok: false; error: string };
      const job = pendingJobs.get(data.id);
      if (!job) return;
      pendingJobs.delete(data.id);
      if (data.ok) job.resolve(data.glb);
      else job.reject(new Error(data.error));
    };
    worker.onerror = () => {
      // The worker script itself failed — retire it and push in-flight jobs
      // onto the main-thread fallback.
      const jobs = [...pendingJobs.values()];
      pendingJobs.clear();
      worker?.terminate();
      worker = null;
      for (const job of jobs) job.reject(new WorkerUnavailableError());
    };
    worker.onmessageerror = () => {
      // A message failed structured-clone deserialization. Without this the
      // affected job would hang forever — entry stuck on "converting",
      // Upload stuck at "Converting...". We can't tell WHICH message died,
      // so fail every pending job into a retryable error (a plain Error,
      // not WorkerUnavailableError: the worker itself still works, so no
      // main-thread fallback).
      const jobs = [...pendingJobs.values()];
      pendingJobs.clear();
      for (const job of jobs) {
        job.reject(
          new Error("Conversion result failed to decode — please retry."),
        );
      }
    };
  } catch {
    worker = null;
  }
  return worker;
}

function convertInWorker(
  workerInstance: Worker,
  buffer: ArrayBuffer,
  ext: ConvertibleModelExtension,
  name: string,
): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const id = nextJobId++;
    pendingJobs.set(id, { resolve, reject });
    workerInstance.postMessage({ id, buffer, ext, name }, [buffer]);
  });
}
