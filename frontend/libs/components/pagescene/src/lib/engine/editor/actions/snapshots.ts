import * as THREE from "three";
import type Editor from "../../editor";

// Shared snapshot types + helpers used by every UndoableAction that
// captures a piece of scene state. Lives outside HistoryManager so
// new action classes can import without pulling the manager itself.

export interface TransformSnap {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// Enough state to fully reconstruct any object: primitive shape,
// image plane, GLB, MMD, splat. Captured at create-time and at
// delete-time so undo of either operation works the same way.
export interface ObjectSnap {
  uuid: string;
  name: string;
  media_id: string;
  transform: TransformSnap;
  userData: Record<string, unknown>;
}

export const snapshotTransform = (obj: THREE.Object3D): TransformSnap => ({
  position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
  rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
  scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
});

export const snapshotObject = (obj: THREE.Object3D): ObjectSnap => ({
  uuid: obj.uuid,
  name: obj.name,
  media_id: (obj.userData.media_id as string) ?? "Parim",
  transform: snapshotTransform(obj),
  userData: { ...obj.userData },
});

export const transformsEqual = (a: TransformSnap, b: TransformSnap): boolean =>
  a.position.x === b.position.x &&
  a.position.y === b.position.y &&
  a.position.z === b.position.z &&
  a.rotation.x === b.rotation.x &&
  a.rotation.y === b.rotation.y &&
  a.rotation.z === b.rotation.z &&
  a.scale.x === b.scale.x &&
  a.scale.y === b.scale.y &&
  a.scale.z === b.scale.z;

export const writeTransform = (
  editor: Editor,
  uuid: string,
  t: TransformSnap,
): void => {
  const obj = editor.activeScene.scene.getObjectByProperty("uuid", uuid);
  if (!obj) return;
  obj.position.set(t.position.x, t.position.y, t.position.z);
  obj.rotation.set(t.rotation.x, t.rotation.y, t.rotation.z);
  obj.scale.set(t.scale.x, t.scale.y, t.scale.z);
};

// Re-create an object from a snapshot. Used by Create/Delete actions
// to undo deletions and redo creations. Preserves the original uuid
// so subsequent history entries that reference it still resolve.
export const recreateFromSnapshot = async (
  editor: Editor,
  snap: ObjectSnap,
): Promise<THREE.Object3D | undefined> => {
  const pos = new THREE.Vector3(
    snap.transform.position.x,
    snap.transform.position.y,
    snap.transform.position.z,
  );
  // Shapes route through scene.instantiate's geometry switch, which
  // matches on the geometry key ("Box", "Sphere", "PointLight"), not
  // the display name ("Cube", "Point Light"). addShape stashes the
  // original key in userData.shapeKey so we can recover it here.
  const nameForCreate =
    (snap.userData.shapeKey as string | undefined) ?? snap.name;
  const obj = await editor.sceneManager?.create(
    snap.media_id,
    nameForCreate,
    pos,
  );
  if (!obj) return undefined;
  obj.uuid = snap.uuid;
  // Restore the display name (instantiate/loadObject set obj.name to
  // nameForCreate; for shapes that's the geometry key, not the label).
  obj.name = snap.name;
  obj.rotation.set(
    snap.transform.rotation.x,
    snap.transform.rotation.y,
    snap.transform.rotation.z,
  );
  obj.scale.set(
    snap.transform.scale.x,
    snap.transform.scale.y,
    snap.transform.scale.z,
  );
  obj.userData = { ...snap.userData };
  if (typeof snap.userData.color === "string") {
    editor.activeScene.setColor(obj.uuid, snap.userData.color);
  }
  if (typeof snap.userData.visible === "boolean") {
    obj.visible = snap.userData.visible;
  }
  return obj;
};
