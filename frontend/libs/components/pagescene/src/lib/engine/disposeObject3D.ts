import * as THREE from "three";
import { SplatMesh } from "@sparkjsdev/spark";

// Free the GPU resources held by an object tree that is leaving the scene
// for good: geometries, materials, the textures those materials reference
// (Material.dispose() does not free its maps), skeleton bone textures and
// Spark splat buffers. Call it after the tree has been removed.
//
// Geometry, material and texture disposal is safe even if one of them is
// shared with an object that stays — three.js re-uploads it the next time
// it renders. Splat buffers are not re-creatable, but every SplatMesh owns
// its own (scene.ts builds one per load), and undo re-loads deleted
// objects from their snapshot rather than reusing the instance.
export function disposeObject3D(root: THREE.Object3D): void {
  const materials = new Set<THREE.Material>();
  root.traverse((child) => {
    if (child instanceof SplatMesh) child.dispose();
    if (child instanceof THREE.SkinnedMesh) child.skeleton?.dispose();

    const { geometry, material } = child as Partial<THREE.Mesh>;
    geometry?.dispose();
    const childMaterials = Array.isArray(material) ? material : [material];
    for (const childMaterial of childMaterials) {
      if (childMaterial) materials.add(childMaterial);
    }
  });

  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) value.dispose();
    }
    material.dispose();
  }
}
