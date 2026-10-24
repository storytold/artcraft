// FBXLoader turns the raw bytes of an .fbx file into a three.js object tree (a "Group" holding meshes,
// bones and animation clips). Imported from three's "addons" folder, which is where three keeps
// loaders that are not part of its core bundle.
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
// GLTFExporter does the reverse job: it takes a three.js object tree and writes it out as glTF/GLB,
// the format the Artcraft backend and the 3D preview understand.
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// Runs the CPU-heavy FBX parse + GLTF export off the main thread so big
// files can't freeze the UI. One message in ({ id, buffer }) → one message
// out ({ id, ok, glb } or { id, ok: false, error }); the GLB buffer is
// transferred, not copied. Texture processing (rare for Mixamo files) uses
// OffscreenCanvas inside GLTFExporter, which our Chromium targets support.
//
// For a beginner: a Web Worker is a second JavaScript thread. It cannot touch the page (no `document`,
// no React state) and talks to the page only by posting messages. `convertFbxToGlb.ts` (the main-thread
// side of this pair) creates this worker, sends it the file bytes, and waits for the reply that carries
// the same `id`. Nothing in this file reads or writes any app state.

// The shape of the one kind of message the page sends to this worker.
interface ConvertRequest {
  // A number chosen by the caller so it can match each reply to the request that caused it
  // (several conversions can be in flight at the same time).
  id: number;
  // The whole .fbx file as raw bytes, already read from disk by the caller.
  buffer: ArrayBuffer;
}

// The two shapes of reply this worker sends back: success carries the converted GLB bytes,
// failure carries the error text. `ok` is the field the caller checks to tell them apart.
type ConvertResponse =
  | { id: number; ok: true; glb: ArrayBuffer }
  | { id: number; ok: false; error: string };

// Typed shim over the worker global — avoids needing the "webworker" TS lib
// in a config that otherwise targets the DOM.
// (`self` inside a worker is the worker's own global object. The cast gives TypeScript just the two
// members used below: the `onmessage` slot to listen with and `postMessage` to reply with. The optional
// second argument of postMessage lists buffers to hand over instead of copying.)
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ConvertRequest>) => void) | null;
  postMessage: (message: ConvertResponse, transfer?: Transferable[]) => void;
};

// Register the handler that runs once for every request the page posts to this worker.
scope.onmessage = async (event) => {
  // Pull the caller's id and the file bytes out of the incoming message.
  const { id, buffer } = event.data;
  // Everything that can throw (a corrupt file, an exporter failure) is inside this try so the page always
  // gets an answer; without it a failure would leave the caller waiting forever.
  try {
    // Parse the FBX bytes into a three.js Group. The empty string is the "resource path" used to find
    // external texture files; an uploaded file has none, so it is left blank.
    const group = new FBXLoader().parse(buffer, "");
    // GLTFExporter reports through callbacks, so it is wrapped in a Promise to be awaited here.
    const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
      new GLTFExporter().parse(
        // What to export: the whole parsed object tree.
        group,
        // Success callback: with `binary: true` the result must be an ArrayBuffer (a .glb file).
        (result) => {
          if (result instanceof ArrayBuffer) {
            // Hand the GLB bytes to the awaiting code above.
            resolve(result);
          } else {
            // The exporter gave JSON instead of bytes, which this pipeline cannot upload.
            reject(new Error("GLTF export did not produce binary output."));
          }
        },
        // Failure callback: pass the exporter's own error on to the catch below.
        (error) => reject(error),
        // Export options: write one binary .glb file, and carry over the animation clips found in the
        // FBX so a Mixamo animation keeps its motion (`?? []` covers a file that has none).
        { binary: true, animations: group.animations ?? [] },
      );
    });
    // Reply to the page with the GLB. The second argument transfers the buffer's ownership to the page
    // instead of copying it (after this line the worker can no longer read `glb`).
    scope.postMessage({ id, ok: true, glb }, [glb]);
  } catch (error) {
    // Any failure above becomes an `ok: false` reply with the error as text, so the caller can show it.
    scope.postMessage({ id, ok: false, error: String(error) });
  }
};
