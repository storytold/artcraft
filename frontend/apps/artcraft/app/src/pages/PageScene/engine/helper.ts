import Scene from "./scene";
import Editor from "./editor";
import * as THREE from "three";
import { XYZ } from "../datastructures/common";
import { EditorStates } from "../enums";
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

  // For react to see if an object has lipsync capability or not.
  isObjectLipsync(object_uuid: string) {
    const object = this.scene.get_object_by_uuid(object_uuid);
    let hasLipsync = false;
    if (object) {
      object.traverse((c: THREE.Object3D) => {
        if (c instanceof THREE.Mesh) {
          if (c.morphTargetInfluences && c.morphTargetDictionary) {
            const blendShapeIndexE = c.morphTargetDictionary["E"];
            // console.log(c.morphTargetDictionary, blendShapeIndexE)
            if (blendShapeIndexE !== null) {
              hasLipsync = true;
            }
          }
        }
      });
    }
    return hasLipsync;
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
    //console.log("No object found.");
    return false;
  }

  // Locks or unlocks and object and returns its new state,
  lockUnlockObject(object_uuid: string): boolean {
    const object = this.scene.get_object_by_uuid(object_uuid);
    if (object) {
      if (object.userData["locked"] == undefined) {
        object.userData["locked"] = false;
      }
      object.userData["locked"] = !object.userData["locked"];

      if (object.userData["locked"]) {
        this.removeTransformControls(false);
      } else {
        this.editor.gizmo.addToScene(this.scene.scene);
        const selected = this.editor.sceneManager?.selected_objects?.[0];
        if (selected) this.editor.gizmo.attach(selected);
      }

      return object.userData["locked"];
    }
    //console.log("No object found.");
    return false;
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
      this.editor.publishSelect();
    }
    this.editor.gizmo.detach();
    this.editor.gizmo.removeFromScene(this.editor.activeScene.scene);
    if (remove_outline) outlinePass.selectedObjects = [];
  }

  // TO UPDATE selected objects in the scene might want to add to the scene ...
  async setSelectedObject(position: XYZ, rotation: XYZ, scale: XYZ) {
    if (this.editor.sceneManager?.selected_objects) {
      const object = this.editor.sceneManager?.selected_objects[0];
      if (object != undefined || object != null) {
        object.position.x = position.x;
        object.position.y = position.y;
        object.position.z = position.z;
        object.rotation.x = THREE.MathUtils.degToRad(rotation.x);
        object.rotation.y = THREE.MathUtils.degToRad(rotation.y);
        object.rotation.z = THREE.MathUtils.degToRad(rotation.z);
        object.scale.x = scale.x;
        object.scale.y = scale.y;
        object.scale.z = scale.z;
      }
    }
  }

  switchCameraView() {
    this.editor.camera_person_mode = !this.editor.camera_person_mode;
    if (this.editor.freeCamState) {
      this.editor.freeCamState.velocity.set(0, 0, 0);
    }
    if (this.editor.cam_obj) {
      if (this.editor.camera_person_mode && this.editor.camera) {
        this.editor.last_cam_pos.copy(this.editor.camera.position);
        this.editor.last_cam_rot.copy(this.editor.camera.rotation);

        this.editor.camera.position.copy(this.editor.cam_obj.position);
        this.editor.camera.rotation.copy(this.editor.cam_obj.rotation);

        if (this.editor.lockControls) {
          this.editor.activeScene.scene.add(
            this.editor.lockControls.getObject(),
          );
        }
        // useFreeCam reads editorState from the store and enables
        // itself when CAMERA_VIEW; nothing to do here.
        this.editor.cam_obj.scale.set(0, 0, 0);

        this.removeTransformControls();
        this.editor.selection.selected = this.editor.cam_obj;
        this.editor.publishSelect();
        this.editor.updateSelectedUI();
        usePageSceneStore.getState().setEditorState(EditorStates.CAMERA_VIEW);
        if (this.editor.activeScene.hot_items) {
          this.editor.activeScene.hot_items.forEach((element) => {
            element.visible = false;
          });
        }

        // Make a better solution later but for now this is so that in camera mode when you right click it does not bring up the context menu and allows you to pan.
        setTimeout(
          () =>
            document
              .getElementById("letterbox")
              ?.addEventListener("contextmenu", function (event) {
                event.preventDefault();
              }),
          250,
        );
      } else if (this.editor.camera) {
        this.editor.camera.position.copy(this.editor.last_cam_pos);
        this.editor.camera.rotation.copy(this.editor.last_cam_rot);
        if (this.editor.lockControls) {
          this.editor.activeScene.scene.remove(
            this.editor.lockControls.getObject(),
          );
        }
        this.editor.cam_obj.scale.set(1, 1, 1);
        if (this.editor.activeScene.hot_items) {
          this.editor.activeScene.hot_items.forEach((element) => {
            element.visible = true;
          });
        }

        usePageSceneStore.getState().hideObjectPanel();
        usePageSceneStore.getState().setEditorState(EditorStates.EDIT);
      }
    }
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
    if (obj.name === this.editor.camera_name) {
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
    this.editor.publishSelect();
    usePageSceneStore.getState().hideObjectPanel();
  }
}
