import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// Convert an FBX file (e.g. a Mixamo download) to a binary GLB, preserving
// skeletal animation clips. Everything downstream of the picker — the
// preview canvas, the backend asset, the scene loader, the timeline clip
// loader, Viewer3D — is GLTF-only, so FBX is normalized here once instead
// of teaching an FBX loader to every consumer.
//
// The parse + export are synchronous CPU work, so they run in a Web Worker
// (convertFbxToGlb.worker.ts) to keep the UI responsive; the worker handles
// jobs one at a time, which also stops a multi-file pick from
// oversubscribing cores. If the worker can't start (bundler/environment),
// conversion falls back to the main thread — same result, just jankier.
//
// Caveats (fine for the Mixamo use case, revisit if needed):
// - Embedded/relative-path textures may not survive; geometry, skeleton and
//   clips do.
// - Units are exported as parsed (Mixamo rigs are cm-scaled); no rescaling
//   is applied here.
export async function convertFbxToGlb(file: File): Promise<File> {
  const glb = await convert(file);
  const stem = file.name.slice(0, file.name.lastIndexOf("."));
  return new File([glb], `${stem}.glb`, { type: "model/gltf-binary" });
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

async function convert(file: File): Promise<ArrayBuffer> {
  const workerInstance = getWorker();
  if (workerInstance) {
    try {
      // The buffer is transferred (detached) to the worker, so the fallback
      // below re-reads it from the File.
      return await convertInWorker(workerInstance, await file.arrayBuffer());
    } catch (error) {
      if (!(error instanceof WorkerUnavailableError)) throw error;
    }
  }
  return convertOnMainThread(await file.arrayBuffer());
}

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  if (typeof Worker === "undefined") {
    worker = null;
    return worker;
  }
  try {
    worker = new Worker(
      new URL("./convertFbxToGlb.worker.ts", import.meta.url),
      { type: "module" },
    );
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
          new Error("FBX conversion result failed to decode — please retry."),
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
): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const id = nextJobId++;
    pendingJobs.set(id, { resolve, reject });
    workerInstance.postMessage({ id, buffer }, [buffer]);
  });
}

async function convertOnMainThread(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const group = new FBXLoader().parse(buffer, "");
  return new Promise<ArrayBuffer>((resolve, reject) => {
    new GLTFExporter().parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error("GLTF export did not produce binary output."));
        }
      },
      (error) => reject(error),
      { binary: true, animations: group.animations ?? [] },
    );
  });
}
