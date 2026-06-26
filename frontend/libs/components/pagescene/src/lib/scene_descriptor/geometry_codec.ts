// Per-object vertex-data extraction for the scene descriptor.
//
// Produces a flat, non-indexed position buffer (triangle soup) in the
// object's LOCAL space by walking its mesh descendants and baking each
// mesh's transform relative to the object root. This is the "potentially
// large" payload — only attached to a descriptor entity when geometry
// export is requested (or for geometry-defined `mesh` entities).
//
// We deliberately keep only positions: normals are recomputed on import
// and textures/UVs are out of scope (gray-box).

import * as THREE from "three";
import { DescriptorGeometry } from "./scene_descriptor";

// Hard cap so a stray dense asset can't produce a multi-hundred-MB
// descriptor. Caller is told (via the truncated flag) if we hit it.
const MAX_VERTICES = 200_000;

export function extractGeometry(
  object: THREE.Object3D,
): DescriptorGeometry | undefined {
  object.updateMatrixWorld(true);
  const toLocal = new THREE.Matrix4().copy(object.matrixWorld).invert();
  const rel = new THREE.Matrix4();
  const v = new THREE.Vector3();
  const positions: number[] = [];
  let truncated = false;

  object.traverse((child) => {
    if (truncated) return;
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const posAttr = mesh.geometry.getAttribute("position");
    if (!posAttr) return;

    // mesh-local → object-local: inv(object.world) * mesh.world
    rel.multiplyMatrices(toLocal, mesh.matrixWorld);
    const index = mesh.geometry.getIndex();
    const count = index ? index.count : posAttr.count;

    for (let i = 0; i < count; i++) {
      if (positions.length / 3 >= MAX_VERTICES) {
        truncated = true;
        break;
      }
      const vi = index ? index.getX(i) : i;
      v.fromBufferAttribute(posAttr, vi).applyMatrix4(rel);
      positions.push(round(v.x), round(v.y), round(v.z));
    }
  });

  if (positions.length === 0) return undefined;
  return { positions, vertexCount: positions.length / 3 };
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e5) / 1e5;
}
