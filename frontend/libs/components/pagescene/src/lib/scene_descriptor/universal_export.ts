// Universal-format export of the live scene — the interchange "fallback"
// alongside the compact JSON descriptor. glTF/GLB is the portable target
// every DCC tool and most LLMs understand; USDZ is offered as a second
// universal option. Both operate on a pruned clone of the scene that
// contains only real content (no grid, gizmo, or internal bbox helpers).

import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { USDZExporter } from "three/addons/exporters/USDZExporter.js";
import type Editor from "../engine/editor";
import { isInternalBbox } from "../engine/internalBbox";

// Collect exportable content into a fresh group. We clone so the export
// pass can't disturb the live scene graph, and we keep only nodes the
// editor considers real objects (those tagged with a media_id), dropping
// editor scaffolding (grid, TransformControls, bbox helpers).
function buildExportGroup(editor: Editor): THREE.Group {
  const group = new THREE.Group();
  group.name = "ArtcraftSceneExport";
  const scene = editor.activeScene?.scene;
  if (!scene) return group;
  for (const child of scene.children) {
    if (isInternalBbox(child)) continue;
    if (child.userData?.["media_id"] == null) continue;
    group.add(child.clone(true));
  }
  return group;
}

// glTF (or binary GLB). Returns a Blob ready to download.
export async function exportSceneToGltf(
  editor: Editor,
  options: { binary?: boolean } = {},
): Promise<Blob> {
  const binary = options.binary ?? true;
  const group = buildExportGroup(editor);
  const exporter = new GLTFExporter();

  const result = await new Promise<ArrayBuffer | object>((resolve, reject) => {
    exporter.parse(
      group,
      (out) => resolve(out as ArrayBuffer | object),
      (err) => reject(err),
      { binary, onlyVisible: false },
    );
  });

  if (binary) {
    return new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
  }
  return new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
}

// USDZ. Returns a Blob ready to download.
//
// three 0.171 exposes `parseAsync(scene, options): Promise<Uint8Array>`,
// but the installed @types/three only declares the older callback-shaped
// `parse`. Reach the runtime method through a narrow typed view so this
// is correct at runtime and still type-checks.
type UsdzAsync = {
  parseAsync(scene: THREE.Object3D, options?: object): Promise<Uint8Array>;
};

export async function exportSceneToUsdz(editor: Editor): Promise<Blob> {
  const group = buildExportGroup(editor);
  const exporter = new USDZExporter() as unknown as UsdzAsync;
  const bytes = await exporter.parseAsync(group);
  return new Blob([bytes], { type: "model/vnd.usdz+zip" });
}
