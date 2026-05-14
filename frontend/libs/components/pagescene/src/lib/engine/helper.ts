import * as THREE from "three";
import type { SelectionOutlinePass } from "./SelectionOutlinePass";
import type { TransformControls } from "./TransformControls.js";

import Scene from "./scene";
import type { EngineEventBus } from "./events/EngineEventBus";
import {
  InspectorPanelChangedEvent,
  ObjectRemovedEvent,
} from "./events/EngineEvent";

// Capabilities SceneUtils needs from outside its own state. Editor
// wires these in inline at construction (Phase 2 idiom — same shape
// as CameraControllerDeps, SaveManagerDeps, etc.). SceneUtils does
// NOT import Editor — every cross-subsystem reach is a callback or
// getter on this object.
export type SceneUtilsDeps = {
  // Gizmo lifecycle (used by removeTransformControls)
  getGizmoControl: () => TransformControls | undefined;
  detachGizmo: () => void;
  removeGizmoFromScene: () => void;
  // Selection outline pass (used by removeTransformControls)
  getSelectionPass: () => SelectionOutlinePass | undefined;
  // Selection sync (used by removeTransformControls + deleteObject)
  publishSelect: () => void;
  clearSelected: () => void;
  // Camera identity (used by deleteObject — protects ::CAM:: from delete)
  getCameraName: () => string;
  // Selected object lookup (used by getSelectedSum)
  getSelectedObject: () => THREE.Object3D | undefined;
  // Three scene root (used by deleteObject + removeTransformControls)
  getThreeScene: () => THREE.Scene;
  // Typed event bus — every engine→store write goes through here.
  bus: EngineEventBus;
};

export class SceneUtils {
  scene: Scene;
  private deps: SceneUtilsDeps;

  constructor(scene: Scene, deps: SceneUtilsDeps) {
    this.scene = scene;
    this.deps = deps;
  }

  // If string is empty.
  isEmpty(value: string): boolean {
    return (
      value == null || (typeof value === "string" && value.trim().length === 0)
    );
  }

  // Returns if the object is locked or unlocked.
  isObjectLocked(object_uuid: string): boolean {
    const object = this.scene.get_object_by_uuid(object_uuid);
    if (object) {
      if (object.userData["locked"] == undefined) {
        object.userData["locked"] = false;
      }
      return object.userData["locked"];
    }
    return false;
  }

  // Pure userData mutation: flips the locked flag and returns the new
  // value. Higher-level wiring (gizmo attach/detach, selection refresh)
  // lives on SelectionBridge.lockUnlockObject.
  toggleObjectLocked(object_uuid: string): boolean {
    const object = this.scene.get_object_by_uuid(object_uuid);
    if (!object) return false;
    if (object.userData["locked"] == undefined) {
      object.userData["locked"] = false;
    }
    object.userData["locked"] = !object.userData["locked"];
    return object.userData["locked"];
  }

  // Direct setter used by history replay — sets userData.locked without
  // toggling. Side effects (gizmo attach/detach) live on SelectionBridge.
  setObjectLocked(object_uuid: string, locked: boolean) {
    const object = this.scene.get_object_by_uuid(object_uuid);
    if (object) object.userData["locked"] = locked;
  }

  // Removes transform controls and publishes selected.
  removeTransformControls(remove_outline: boolean = true) {
    if (this.deps.getGizmoControl() == undefined) {
      return;
    }
    const selectionPass = this.deps.getSelectionPass();
    if (selectionPass == undefined) {
      return;
    }
    if (remove_outline) {
      selectionPass.setSelectedObjects([]);
      this.deps.publishSelect();
    }
    this.deps.detachGizmo();
    this.deps.removeGizmoFromScene();
    if (remove_outline) selectionPass.setSelectedObjects([]);
  }

  // Returns the "check sum" of the editor's selected object.
  getSelectedSum(): number {
    const selected = this.deps.getSelectedObject();
    if (selected === undefined) return 0;
    const posCombo =
      selected.position.x + selected.position.y + selected.position.z;
    const rotCombo =
      selected.rotation.x + selected.rotation.y + selected.rotation.z;
    const sclCombo = selected.scale.x + selected.scale.y + selected.scale.z;
    return posCombo + rotCombo + sclCombo;
  }

  /* Will add in the future

A good practice to remove 3D objects from Three.js scenes
function removeObject3D(object3D) {
    if (!(object3D instanceof THREE.Object3D)) return false;

    // for better memory management and performance
    if (object3D.geometry) object3D.geometry.dispose();

    if (object3D.material) {
        if (object3D.material instanceof Array) {
            // for better memory management and performance
            object3D.material.forEach(material => material.dispose());
        } else {
            // for better memory management and performance
            object3D.material.dispose();
        }
    }
    object3D.removeFromParent(); // the parent might be the scene or another Object3D, but it is sure to be removed this way
    return true;
}

 */

  deleteObject(uuid: string) {
    const obj = this.scene.get_object_by_uuid(uuid);

    if (!obj) {
      return
    }

    this.removeTransformControls();
    if (obj.name === this.deps.getCameraName()) {
      return;
    }

    // Finally remove the object from the scene
    this.scene.scene.remove(obj);

    obj.traverse(child => {
      (child as THREE.Mesh)?.geometry?.dispose()
      if (Array.isArray((child as THREE.Mesh).texture)) {
        (child as THREE.Mesh).texture.forEach(mat => mat.dispose());
      } else if ((child as THREE.Mesh).texture) {
        (child as THREE.Mesh).texture.dispose();
      }

      if (Array.isArray((child as THREE.Mesh).material)) {
        (child as THREE.Mesh).material.forEach(mat => mat.dispose());
      } else if ((child as THREE.Mesh).material) {
        (child as THREE.Mesh).material.dispose();
      }
    })

    if (Array.isArray((obj as THREE.Mesh).texture)) {
      (obj as THREE.Mesh).texture.forEach(mat => mat.dispose());
    } else if ((obj as THREE.Mesh).texture) {
      (obj as THREE.Mesh).texture.dispose();
    }

    if (Array.isArray((obj as THREE.Mesh).material)) {
      (obj as THREE.Mesh).material.forEach(mat => mat.dispose());
    } else if ((obj as THREE.Mesh).material) {
      (obj as THREE.Mesh).material.dispose();
    }

    if ((obj as THREE.Mesh).geometry) {
      (obj as THREE.Mesh).geometry.dispose()
    }

    this.deps.bus.emit(new ObjectRemovedEvent(uuid));
    this.deps.clearSelected();
    this.deps.publishSelect();
    this.deps.bus.emit(new InspectorPanelChangedEvent(null));
  }
}
