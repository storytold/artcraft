import {
  ConvertibleModelExtension,
  convertModelBufferToGlb,
} from "./modelToGlb";

// Runs the CPU-heavy model parse + GLTF export off the main thread so big
// files can't freeze the UI. Announces itself with { ready: true } once the
// script has loaded, then one message in ({ id, buffer, ext, name }) → one
// message out ({ id, ok, glb } or { id, ok: false, error }); the GLB
// buffer is transferred, not copied. Texture processing (rare for Mixamo
// files) uses OffscreenCanvas inside GLTFExporter, which our Chromium
// targets support.

interface ConvertRequest {
  id: number;
  buffer: ArrayBuffer;
  ext: ConvertibleModelExtension;
  name: string;
}

type ConvertResponse =
  | { ready: true }
  | { id: number; ok: true; glb: ArrayBuffer }
  | { id: number; ok: false; error: string };

// Typed shim over the worker global — avoids needing the "webworker" TS lib
// in a config that otherwise targets the DOM.
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ConvertRequest>) => void) | null;
  postMessage: (message: ConvertResponse, transfer?: Transferable[]) => void;
};

const convert = async (event: MessageEvent<ConvertRequest>) => {
  const { id, buffer, ext, name } = event.data;
  try {
    const glb = await convertModelBufferToGlb(buffer, ext, name);
    scope.postMessage({ id, ok: true, glb }, [glb]);
  } catch (error) {
    // The message alone — the main thread adds its own context.
    const message = error instanceof Error ? error.message : String(error);
    scope.postMessage({ id, ok: false, error: message });
  }
};

scope.onmessage = (event) => {
  void convert(event);
};

// Lets the main thread tell a script that never loaded (it falls back to
// converting there) from a file that crashed a working worker (it doesn't).
scope.postMessage({ ready: true });
