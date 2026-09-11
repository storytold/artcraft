import * as THREE from "three";

// SkeletonHelper equivalent for rigs whose joints are NOT THREE.Bone
// instances. GLTF only round-trips bone-ness through a skin, and exporters
// only write a skin for a SkinnedMesh — so a mesh-less animation export
// (e.g. a Mixamo "without skin" FBX converted to GLB) re-imports as a plain
// Object3D hierarchy, for which THREE.SkeletonHelper draws nothing. This
// helper draws parent→child segments for every descendant pair instead,
// refreshing from world matrices on each render exactly like SkeletonHelper.
export class NodeHierarchyHelper extends THREE.LineSegments {
  private readonly pairs: Array<[THREE.Object3D, THREE.Object3D]>;

  constructor(root: THREE.Object3D) {
    const pairs: Array<[THREE.Object3D, THREE.Object3D]> = [];
    root.traverse((node) => {
      // Skip segments hanging off the container root itself — those draw
      // spokes from the model origin; only intra-hierarchy links inform.
      if (node !== root && node.parent && node.parent !== root) {
        pairs.push([node.parent, node]);
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(pairs.length * 2 * 3), 3),
    );
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    });
    super(geometry, material);

    this.pairs = pairs;
    // Positions are written in WORLD space each update; the helper's own
    // transform stays identity (mirrors THREE.SkeletonHelper).
    this.matrixAutoUpdate = false;
    this.frustumCulled = false;
    this.renderOrder = 999;
  }

  override updateMatrixWorld(force?: boolean): void {
    const position = this.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const vector = new THREE.Vector3();
    let index = 0;
    for (const [parent, child] of this.pairs) {
      vector.setFromMatrixPosition(parent.matrixWorld);
      position.setXYZ(index++, vector.x, vector.y, vector.z);
      vector.setFromMatrixPosition(child.matrixWorld);
      position.setXYZ(index++, vector.x, vector.y, vector.z);
    }
    position.needsUpdate = true;
    super.updateMatrixWorld(force);
  }

  dispose(): void {
    this.geometry.dispose();
    (this.material as THREE.Material).dispose();
  }
}

// True when the subtree contains real THREE.Bone joints — the signal to
// prefer THREE.SkeletonHelper over the generic hierarchy overlay.
export const objectHasBones = (root: THREE.Object3D): boolean => {
  let found = false;
  root.traverse((node) => {
    if ((node as THREE.Bone).isBone) found = true;
  });
  return found;
};

// Pick the right rig overlay for a model: real bones → SkeletonHelper,
// otherwise the generic node-hierarchy lines.
export const createRigHelper = (
  root: THREE.Object3D,
): THREE.SkeletonHelper | NodeHierarchyHelper =>
  objectHasBones(root) ? new THREE.SkeletonHelper(root) : new NodeHierarchyHelper(root);
