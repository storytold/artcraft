import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// Convert an FBX file (e.g. a Mixamo download) to a binary GLB in the
// browser, preserving skeletal animation clips. Everything downstream of the
// picker — the preview canvas, the backend asset, the scene loader, the
// timeline clip loader, Viewer3D — is GLTF-only, so FBX is normalized here
// once instead of teaching an FBX loader to every consumer.
//
// Caveats (fine for the Mixamo use case, revisit if needed):
// - Embedded/relative-path textures may not survive; geometry, skeleton and
//   clips do.
// - Units are exported as parsed (Mixamo rigs are cm-scaled); no rescaling
//   is applied here.
export async function convertFbxToGlb(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
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

  const stem = file.name.slice(0, file.name.lastIndexOf("."));
  return new File([glb], `${stem}.glb`, { type: "model/gltf-binary" });
}
