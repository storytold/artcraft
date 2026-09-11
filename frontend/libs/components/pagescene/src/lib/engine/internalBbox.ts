// Single source of truth for the splat selection bbox marker + helpers.
//
// A "__bbox_internal" child is attached to each splat at load time —
// a hidden wireframe Box matching the splat's local extents. The
// selection-event path toggles its `.visible` flag instead of building
// or recomputing bounds each frame.
//
// The marker key lets the save/load/outliner sites filter these helpers
// out so they never leak into serialized scenes or UI lists. All such
// sites must import BBOX_INTERNAL_KEY (or isInternalBbox) from here —
// don't write the literal string inline anywhere.

import * as THREE from "three";
import { SELECTION_OUTLINE_ACCENT_COLOR } from "./selectionColors";

export const BBOX_INTERNAL_KEY = "__bbox_internal";

// Attach a hidden wireframe bbox child to `parent` for selection cueing.
// Idempotent: if a child tagged BBOX_INTERNAL_KEY already exists, this
// is a no-op. Also no-ops if the local box is empty (no bounds to draw).
export function ensureInternalBbox(
  parent: THREE.Object3D,
  localBox: THREE.Box3,
): void {
  if (findInternalBbox(parent)) return;
  if (localBox.isEmpty()) return;
  parent.add(createInternalBbox(localBox));
}

// Look up the bbox child on `parent`. Returns undefined when absent.
export function findInternalBbox(
  parent: THREE.Object3D,
): THREE.LineSegments | undefined {
  for (const child of parent.children) {
    if (child.userData?.[BBOX_INTERNAL_KEY] === true) {
      return child as THREE.LineSegments;
    }
  }
  return undefined;
}

// Predicate for the save/load/outliner filters.
export function isInternalBbox(obj: {
  userData?: Record<string, unknown>;
}): boolean {
  return obj.userData?.[BBOX_INTERNAL_KEY] === true;
}

// Wireframe LineSegments built from an EdgesGeometry of a BoxGeometry,
// not THREE.Box3Helper. Box3Helper.updateMatrixWorld overrides the
// local matrix from its `.box` (scale + translate) which conflicts
// with the parent matrix chain when nested under another transform.
// A plain LineSegments uses the standard Object3D matrix path and
// inherits the splat's world transform correctly.
//
// Marked non-pickable (`raycast = () => {}`) so the wireframe never
// shows up in raycast picking even if some future site enables
// recursive Line picking.
function createInternalBbox(localBox: THREE.Box3): THREE.LineSegments {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  localBox.getSize(size);
  localBox.getCenter(center);
  const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const edges = new THREE.EdgesGeometry(boxGeo);
  boxGeo.dispose();
  const lines = new THREE.LineSegments(
    edges,
    // Static dark orange — matches the outline pulse's trough color so
    // the splat selection cue reads in the same visual family as the
    // mesh-selection halo. No animation on the bbox itself.
    new THREE.LineBasicMaterial({ color: SELECTION_OUTLINE_ACCENT_COLOR }),
  );
  lines.position.copy(center);
  lines.userData[BBOX_INTERNAL_KEY] = true;
  lines.visible = false;
  lines.raycast = () => {};
  return lines;
}
