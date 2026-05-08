import * as THREE from "three";

export type PickDropPositionDeps = {
  getCamera: () => THREE.PerspectiveCamera | null | undefined;
  getCanvas: () => HTMLCanvasElement | null | undefined;
  getRaycastTargets: () => THREE.Object3D[];
  removeTransformControls: () => void;
};

// Cast a ray from the camera through the cursor and return the first
// scene hit. Falls back to origin if the camera/canvas isn't ready or
// nothing is hit. All dependencies arrive through `deps` so the picker
// stays decoupled from Editor and any subsystem's import surface
// (matches the Phase 2 deps pattern used by CameraController etc.).
export function pickDropPosition(
  deps: PickDropPositionDeps,
  pageX: number,
  pageY: number,
): THREE.Vector3 {
  const camera = deps.getCamera();
  const canvas = deps.getCanvas();
  if (!camera || !canvas) return new THREE.Vector3();

  // Hide the gizmo so the raycast doesn't hit it.
  deps.removeTransformControls();

  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((pageX - rect.left) / rect.width) * 2 - 1,
    -((pageY - rect.top) / rect.height) * 2 + 1,
  );

  const raycaster = new THREE.Raycaster();
  raycaster.layers.enable(0);
  raycaster.layers.enable(1);
  raycaster.setFromCamera(ndc, camera);

  const hits = raycaster.intersectObjects(deps.getRaycastTargets(), true);
  if (hits.length > 0) return hits[0].point.clone();
  return new THREE.Vector3();
}
