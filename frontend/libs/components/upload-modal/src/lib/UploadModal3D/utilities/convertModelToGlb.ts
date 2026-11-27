import {
  ConvertibleModelExtension,
  assertConvertibleModelSize,
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
// (convertModelToGlb.worker.ts) to keep the UI responsive; it gets one file
// at a time, which also stops a multi-file pick from oversubscribing cores.
// A file that outlives CONVERSION_TIMEOUT_MS, or takes the worker down, is
// failed and the worker replaced. If the worker can't start at all
// (bundler/environment), conversion falls back to the main thread — same
// result, still one file at a time, just jankier, and with no time limit:
// synchronous work on the UI thread can't be interrupted.
//
// Caveats (fine for the current use cases, revisit if needed):
// - Embedded/relative-path textures may not survive (OBJ .mtl files are not
//   read); geometry, vertex colors, skeleton and clips do.
// - Units and up axis are exported as parsed (Mixamo rigs are cm-scaled,
//   STL/PLY are often mm-scaled and Z-up); no rescaling is applied here.
export async function convertModelToGlb(file: File): Promise<File> {
  const ext = getConvertibleModelExtension(file.name);
  if (!ext) throw new Error(`Unsupported model format: ${file.name}`);
  // Before reading it into memory (the worker checks the buffer again).
  assertConvertibleModelSize(file.size);
  const stem = file.name.slice(0, file.name.lastIndexOf("."));
  const glb = await convert(file, ext, stem);
  return new File([glb], `${stem}.glb`, { type: "model/gltf-binary" });
}

// Files that must go through convertModelToGlb before preview/upload.
export function isConvertibleModelFile(file: File): boolean {
  return getConvertibleModelExtension(file.name) !== null;
}

// ─── worker plumbing ──────────────────────────────────────────────────────

// How long one file may spend in the worker. Meshes at the 50 MB cap convert
// in about a second; the budget leaves room for slower machines and for FBX
// files with embedded textures, and still ends a job that is stuck.
export const CONVERSION_TIMEOUT_MS = 120_000;

// Signals "the worker never started" (script failed to load), as opposed to
// a failure of one file — only the former falls back to the main thread.
class WorkerUnavailableError extends Error {}

interface ConversionJob {
  id: number;
  file: File;
  ext: ConvertibleModelExtension;
  name: string;
  resolve: (glb: ArrayBuffer) => void;
  reject: (error: Error) => void;
}

type WorkerMessage =
  | { ready: true }
  | { id: number; ok: true; glb: ArrayBuffer }
  | { id: number; ok: false; error: string };

// undefined = not started yet; null = unavailable (fall back permanently).
let worker: Worker | null | undefined;
// Set by the worker's first message. An error before it means the script
// never ran; an error after it means a file took down a working worker.
let workerReady = false;
let nextJobId = 0;
// Files wait here and go to the worker one at a time, so the timer covers a
// single file and replacing the worker costs only the file that was running.
// A waiting job holds the File, not its bytes: a multi-file pick would
// otherwise keep every file's buffer in memory until its turn.
const queuedJobs: ConversionJob[] = [];
let activeJob: ConversionJob | null = null;
let activeJobTimer: ReturnType<typeof setTimeout> | undefined;
// The main-thread fallback's own line: settles when the last file sent there
// has finished, whether it converted or failed.
let mainThreadQueue: Promise<void> = Promise.resolve();

async function convert(
  file: File,
  ext: ConvertibleModelExtension,
  name: string,
): Promise<ArrayBuffer> {
  if (getWorker()) {
    try {
      return await convertInWorker(file, ext, name);
    } catch (error) {
      if (!(error instanceof WorkerUnavailableError)) throw error;
    }
  }
  return convertOnMainThread(file, ext, name);
}

// When the worker fails to start, every waiting file lands here at once.
// Each one is read only after the file before it has finished, so the
// fallback holds one input buffer at a time, like the worker queue. A buffer
// read for the worker went with it (transferred, or dropped unused), so the
// File is read again here.
function convertOnMainThread(
  file: File,
  ext: ConvertibleModelExtension,
  name: string,
): Promise<ArrayBuffer> {
  const glb = mainThreadQueue.then(async () =>
    convertModelBufferToGlb(await file.arrayBuffer(), ext, name),
  );
  // A file that fails must not fail the files behind it.
  mainThreadQueue = glb.then(
    () => undefined,
    () => undefined,
  );
  return glb;
}

function convertInWorker(
  file: File,
  ext: ConvertibleModelExtension,
  name: string,
): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    queuedJobs.push({ id: nextJobId++, file, ext, name, resolve, reject });
    startNextJob();
  });
}

function startNextJob(): void {
  if (activeJob || queuedJobs.length === 0) return;
  const workerInstance = getWorker();
  if (!workerInstance) {
    for (const job of queuedJobs.splice(0)) {
      job.reject(new WorkerUnavailableError());
    }
    return;
  }
  const job = queuedJobs.shift() as ConversionJob;
  activeJob = job;
  job.file.arrayBuffer().then(
    (buffer) => {
      // The worker failed while the file was being read, and whoever handled
      // that already took this job (every path that retires a worker does).
      if (activeJob !== job) return;
      activeJobTimer = setTimeout(() => {
        replaceWorker(
          new Error(
            `Conversion took longer than ${CONVERSION_TIMEOUT_MS / 1000} seconds and was stopped.`,
          ),
        );
      }, CONVERSION_TIMEOUT_MS);
      const { id, ext, name } = job;
      workerInstance.postMessage({ id, buffer, ext, name }, [buffer]);
    },
    (error: Error) => {
      if (activeJob !== job) return;
      // The file can't be read (moved or deleted since it was picked): fail
      // it alone and let the files behind it run.
      takeActiveJob();
      job.reject(error);
      startNextJob();
    },
  );
}

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  if (typeof Worker === "undefined") {
    worker = null;
    return worker;
  }
  try {
    const instance = new ConvertModelToGlbWorker();
    // Each handler ignores a worker that has already been replaced.
    instance.onmessage = (event) => {
      if (worker !== instance) return;
      const data = event.data as WorkerMessage;
      if ("ready" in data) {
        workerReady = true;
        return;
      }
      if (activeJob?.id !== data.id) return;
      const job = takeActiveJob() as ConversionJob;
      if (data.ok) job.resolve(data.glb);
      else job.reject(new Error(data.error));
      startNextJob();
    };
    instance.onerror = () => {
      if (worker !== instance) return;
      if (workerReady) {
        replaceWorker(
          new Error(
            "The converter stopped unexpectedly. The file may be too large or complex to convert.",
          ),
        );
        return;
      }
      // The worker script itself failed to load — retire it and push every
      // waiting file onto the main-thread fallback.
      const jobs = [takeActiveJob(), ...queuedJobs.splice(0)];
      instance.terminate();
      worker = null;
      for (const job of jobs) job?.reject(new WorkerUnavailableError());
    };
    instance.onmessageerror = () => {
      if (worker !== instance) return;
      // A message failed structured-clone deserialization. Without this the
      // running job would hang until the timer — entry stuck on
      // "converting", Upload stuck at "Converting...". Fail it into a
      // retryable error (a plain Error, not WorkerUnavailableError: the
      // worker itself still works, so no main-thread fallback).
      takeActiveJob()?.reject(
        new Error("Conversion result failed to decode — please retry."),
      );
      startNextJob();
    };
    worker = instance;
  } catch {
    worker = null;
  }
  return worker;
}

// The running file hung or took the worker down. Fail that one file — it is
// not run again on the UI thread, where the same input would freeze the app
// — and start a fresh worker for the files queued behind it.
function replaceWorker(error: Error): void {
  const job = takeActiveJob();
  worker?.terminate();
  worker = undefined;
  workerReady = false;
  job?.reject(error);
  startNextJob();
}

function takeActiveJob(): ConversionJob | null {
  clearTimeout(activeJobTimer);
  const job = activeJob;
  activeJob = null;
  return job;
}
