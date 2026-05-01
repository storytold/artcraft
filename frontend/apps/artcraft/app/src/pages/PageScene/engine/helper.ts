import Scene from "./scene";
import Editor from "./editor";
import * as THREE from "three";
import { usePageSceneStore } from "../PageSceneStore";

export class SceneUtils {
  scene: Scene;
  editor: Editor;
  constructor(editor: Editor, scene: Scene) {
    this.scene = scene;
    this.editor = editor;
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
    if (this.editor.gizmo.control == undefined) {
      return;
    }
    const outlinePass = this.editor.postProcessing.outlinePass;
    if (outlinePass == undefined) {
      return;
    }
    if (remove_outline) {
      outlinePass.selectedObjects = [];
      this.editor.selection.publishSelect();
    }
    this.editor.gizmo.detach();
    this.editor.gizmo.removeFromScene(this.editor.activeScene.scene);
    if (remove_outline) outlinePass.selectedObjects = [];
  }

  // Returns the "check sum" of the editors selected object.
  getSelectedSum(): number {
    if (this.editor.sceneManager?.selected_objects === undefined) {
      return 0;
    }
    if (this.editor.sceneManager?.selected_objects.length <= 0) {
      return 0;
    }
    const posCombo =
      this.editor.sceneManager?.selected_objects[0].position.x +
      this.editor.sceneManager?.selected_objects[0].position.y +
      this.editor.sceneManager?.selected_objects[0].position.z;
    const rotCombo =
      this.editor.sceneManager?.selected_objects[0].rotation.x +
      this.editor.sceneManager?.selected_objects[0].rotation.y +
      this.editor.sceneManager?.selected_objects[0].rotation.z;
    const sclCombo =
      this.editor.sceneManager?.selected_objects[0].scale.x +
      this.editor.sceneManager?.selected_objects[0].scale.y +
      this.editor.sceneManager?.selected_objects[0].scale.z;
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
    if (obj.name === this.editor.cameraController.camera_name) {
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

    usePageSceneStore.getState().removeSceneObject(uuid);
    this.editor.selection.selected = undefined;
    this.editor.selection.publishSelect();
    usePageSceneStore.getState().hideObjectPanel();
  }
}
