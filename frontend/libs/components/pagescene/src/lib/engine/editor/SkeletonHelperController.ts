import * as THREE from "three";

// Persistent per-object skeleton visualization, toggled from the outliner's
// bone icon. Independent of FK/pose mode's own transient SkeletonHelper
// (FKHelper): while FK mode targets an object, this controller's helper for
// that object is suppressed so the rig isn't double-drawn, and restored when
// FK mode exits — the user's toggle state is never lost.
//
// Helpers live on LAYER 1 (editor-only). The render camera renders layer 0
// exclusively, so skeletons never appear in captures/recordings.
//
// The on/off flag lives in object.userData.skeletonVisible, which rides the
// scene JSON's user_data serialization (with an explicit restore in the
// proxy load path), so it survives save/load. Reconciliation is driven off
// OutlinerRefreshedEvent — every add/delete/load/new-scene funnels through
// an outliner refresh, so sync() needs no bespoke lifecycle hooks.
export class SkeletonHelperController {
  private helpers = new Map<string, THREE.SkeletonHelper>();
  private suppressedUuid: string | null = null;

  constructor(private readonly getScene: () => THREE.Scene) {}

  isVisible(uuid: string): boolean {
    return this.find(uuid)?.userData?.skeletonVisible === true;
  }

  setVisible(uuid: string, visible: boolean): void {
    const obj = this.find(uuid);
    if (!obj) return;
    obj.userData.skeletonVisible = visible;
    this.sync();
  }

  // Hide one object's helper while FK mode draws its own rig overlay for it
  // (null = nothing suppressed). The userData flag is untouched, so the
  // helper reappears when the suppression lifts.
  suppress(uuid: string | null): void {
    this.suppressedUuid = uuid;
    this.applyVisibility();
  }

  // Reconcile helpers with the scene: create for flagged objects (once
  // their bones exist), drop helpers whose object vanished or was
  // unflagged. Idempotent and cheap.
  //
  // A helper is also considered dead when it is ORPHANED (in-session scene
  // reloads — loadScene/loadCache/Reset — strip every scene child wholesale;
  // the map survives, the helper doesn't) or bound to a REPLACED object
  // instance (delete→undo recreates objects under their saved uuids). Both
  // are purged and recreated fresh so the toggle keeps working across
  // reloads instead of flipping visibility on a disposed detached helper.
  sync(): void {
    const scene = this.getScene();
    const wanted = new Map<string, THREE.Object3D>();
    for (const child of scene.children) {
      if (child.userData?.skeletonVisible === true) {
        wanted.set(child.uuid, child);
      }
    }
    for (const [uuid, helper] of [...this.helpers]) {
      const obj = wanted.get(uuid);
      if (!obj || helper.parent !== scene || helper.root !== obj) {
        // parent-based removal: after Scene.initialize() the helper may
        // still hang off the PREVIOUS THREE.Scene instance.
        helper.parent?.remove(helper);
        helper.dispose();
        this.helpers.delete(uuid);
      }
    }
    for (const [uuid, obj] of wanted) {
      if (this.helpers.has(uuid)) continue;
      if (!this.hasBones(obj)) continue; // GLB still loading — next sync
      const helper = new THREE.SkeletonHelper(obj);
      helper.layers.set(1); // editor-only: excluded from the render camera
      scene.add(helper);
      this.helpers.set(uuid, helper);
    }
    this.applyVisibility();
  }

  clear(): void {
    const scene = this.getScene();
    for (const helper of this.helpers.values()) {
      scene.remove(helper);
      helper.dispose();
    }
    this.helpers.clear();
    this.suppressedUuid = null;
  }

  private applyVisibility(): void {
    for (const [uuid, helper] of this.helpers) {
      helper.visible = uuid !== this.suppressedUuid;
    }
  }

  private hasBones(obj: THREE.Object3D): boolean {
    let found = false;
    obj.traverse((child) => {
      if ((child as THREE.Bone).isBone) found = true;
    });
    return found;
  }

  // Top-level scene objects only — helpers attach to outliner-level roots.
  private find(uuid: string): THREE.Object3D | undefined {
    return this.getScene().children.find((child) => child.uuid === uuid);
  }
}
