import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// Runs the CPU-heavy FBX parse + GLTF export off the main thread so big
// files can't freeze the UI. One message in ({ id, buffer }) → one message
// out ({ id, ok, glb } or { id, ok: false, error }); the GLB buffer is
// transferred, not copied. Texture processing (rare for Mixamo files) uses
// OffscreenCanvas inside GLTFExporter, which our Chromium targets support.

interface ConvertRequest {
  id: number;
  buffer: ArrayBuffer;
}

type ConvertResponse =
  | { id: number; ok: true; glb: ArrayBuffer }
  | { id: number; ok: false; error: string };

// Typed shim over the worker global — avoids needing the "webworker" TS lib
// in a config that otherwise targets the DOM.
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ConvertRequest>) => void) | null;
  postMessage: (message: ConvertResponse, transfer?: Transferable[]) => void;
};

scope.onmessage = async (event) => {
  const { id, buffer } = event.data;
  try {
    const group = new FBXLoader().parse(buffer, "");
    const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
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
    scope.postMessage({ id, ok: true, glb }, [glb]);
  } catch (error) {
    scope.postMessage({ id, ok: false, error: String(error) });
  }
};
