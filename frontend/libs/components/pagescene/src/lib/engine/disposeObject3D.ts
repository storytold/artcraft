import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

// Free the GPU resources held by an object tree that is leaving the scene
// for good: geometries, materials, the textures those materials reference
// (Material.dispose() does not free its maps), skeleton bone textures and
// Spark splat buffers. Call it after the tree has been removed.
//
// Textures are found both as material properties (map, normalMap, ...) and
// as ShaderMaterial uniforms (Water's normal and mirror samplers, Spark's
// splat textures). Water keeps its mirror render target in a closure, so
// only that target's color texture can be reached; its framebuffer and depth
// buffer stay allocated.
//
// Geometry, material and texture disposal is safe even if one of them is
// shared with an object that stays — three.js re-uploads it the next time
// it renders. Splat buffers are not re-creatable, but every SplatMesh owns
// its own (scene.ts builds one per load), and undo re-loads deleted
// objects from their snapshot rather than reusing the instance.
export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (child instanceof SplatMesh) child.dispose();
    if (child instanceof SparkRenderer) disposeSparkRenderer(child);
    if (child instanceof THREE.SkinnedMesh) child.skeleton?.dispose();
    (child as Partial<THREE.Mesh>).geometry?.dispose();
  });

  const materials = collectMaterials(root);
  const textures = collectMaterialTextures(materials);
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

// Every texture the tree's materials reference, as material properties or
// ShaderMaterial uniforms, deduplicated.
export function collectObjectTextures(root: THREE.Object3D): Set<THREE.Texture> {
  return collectMaterialTextures(collectMaterials(root));
}

// A SparkRenderer is added to the scene automatically the first time a
// splat renders. Its viewpoint render targets and splat accumulators are
// not reachable from its material, so free them explicitly. The viewpoint
// goes first: disposing it returns its accumulators to the free list.
function disposeSparkRenderer(spark: SparkRenderer): void {
  spark.defaultView.dispose();
  spark.active.splats.dispose();
  const { freeAccumulators } = spark as unknown as {
    freeAccumulators: SparkRenderer["active"][];
  };
  for (const accumulator of freeAccumulators) accumulator.splats.dispose();
}

function collectMaterials(root: THREE.Object3D): Set<THREE.Material> {
  const materials = new Set<THREE.Material>();
  root.traverse((child) => {
    const { material } = child as Partial<THREE.Mesh>;
    const childMaterials = Array.isArray(material) ? material : [material];
    for (const childMaterial of childMaterials) {
      if (childMaterial) materials.add(childMaterial);
    }
  });
  return materials;
}

function collectMaterialTextures(
  materials: Iterable<THREE.Material>,
): Set<THREE.Texture> {
  const textures = new Set<THREE.Texture>();
  for (const material of materials) {
    addTextures(Object.values(material), textures);
    if (material instanceof THREE.ShaderMaterial) {
      addTextures(
        Object.values(material.uniforms).map((uniform) => uniform?.value),
        textures,
      );
    }
  }
  return textures;
}

function addTextures(values: unknown[], into: Set<THREE.Texture>): void {
  for (const value of values) {
    if (value instanceof THREE.Texture) {
      into.add(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof THREE.Texture) into.add(item);
      }
    }
  }
}
