import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import {
  freeCamFrameTick,
  lookAtFromCamera,
  type FreeCamControlState,
} from "../cameraMath";
import { CameraAspectRatio, EditorStates } from "../../enums";
import type { Camera } from "@storyteller/common";
import type { EngineEventBus } from "../events/EngineEventBus";
import { CameraUpdatedEvent } from "../events/EngineEvent";

export type RenderDimensions = {
  width: number;
  height: number;
  aspectRatio: number;
};

// Capabilities CameraController needs from outside its own state.
// Editor wires these in initialize() so CameraController never imports
// sibling subsystems directly.
export type CameraControllerDeps = {
  getThreeScene: () => THREE.Scene;
  getHotItems: () => THREE.Object3D[] | null;
  removeTransformControls: () => void;
  setSelected: (obj: THREE.Object3D | null) => void;
  setEditorState: (state: EditorStates) => void;
  hideObjectPanel: () => void;
  // Camera-list reads from the Zustand store happen at the engine
  // boundary; CameraController stays store-agnostic.
  getCameras: () => Camera[];
  getSelectedCameraId: () => string;
  // Typed event bus — every engine→store write goes through here.
  bus: EngineEventBus;
};

// Owns the editor's camera-related state: the live PerspectiveCameras,
// the cam_obj proxy in the scene, FreeCam control state, lockControls,
// and the per-frame camera tick that ran inline in renderSingleFrame.
//
// Construction is empty; cameras and lockControls are populated by
// Editor.initialize() once the renderer + canvas exist.
export class CameraController {
  // The reserved name used to find the camera entity in the THREE scene.
  readonly camera_name: string = "::CAM::";

  camera: THREE.PerspectiveCamera | null = null;
  render_camera: THREE.PerspectiveCamera | null = null;
  render_camera_aspect_ratio: CameraAspectRatio = CameraAspectRatio.HORIZONTAL_3_2;

  cam_obj: THREE.Object3D | undefined;
  camera_person_mode: boolean = false;

  lockControls: PointerLockControls | undefined;

  freeCamState: FreeCamControlState | null = null;

  last_cam_pos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  last_cam_rot: THREE.Euler = new THREE.Euler(0, 0, 0);
  camera_last_pos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  render_width: number;
  render_height: number;

  private deps: CameraControllerDeps;

  constructor(deps: CameraControllerDeps) {
    this.deps = deps;
    const dims = this.getRenderDimensions();
    this.render_width = dims.width;
    this.render_height = dims.height;
  }

  // Re-anchor the camera-person object to the named entity in the scene
  // and put it on layer 1 (along with its children). Used after
  // load/restore flows when a fresh scene replaces the previous one.
  refreshCamObj(scene: THREE.Scene): void {
    this.cam_obj = scene.getObjectByName(this.camera_name);
    this.cam_obj?.layers.set(1);
    this.cam_obj?.children.forEach((child) => {
      child.layers.set(1);
    });
  }

  // Toggles between free-camera (edit) mode and the active render
  // camera's perspective. Lifted from SceneUtils.switchCameraView so
  // the camera state stays in one place.
  switchCameraView() {
    this.camera_person_mode = !this.camera_person_mode;
    if (this.freeCamState) {
      this.freeCamState.velocity.set(0, 0, 0);
    }
    if (!this.cam_obj) return;

    if (this.camera_person_mode && this.camera) {
      this.last_cam_pos.copy(this.camera.position);
      this.last_cam_rot.copy(this.camera.rotation);

      this.camera.position.copy(this.cam_obj.position);
      this.camera.rotation.copy(this.cam_obj.rotation);

      if (this.lockControls) {
        this.deps.getThreeScene().add(this.lockControls.getObject());
      }
      // useFreeCam reads editorState from the store and enables
      // itself when CAMERA_VIEW; nothing to do here.
      this.cam_obj.scale.set(0, 0, 0);

      this.deps.removeTransformControls();
      this.deps.setSelected(this.cam_obj);
      this.deps.setEditorState(EditorStates.CAMERA_VIEW);

      const hot = this.deps.getHotItems();
      if (hot) {
        hot.forEach((element) => {
          element.visible = false;
        });
      }

      // Workaround: in camera mode, a right-click should pan rather
      // than open the browser context menu. Defer the listener attach
      // until after the letterbox swap settles.
      setTimeout(
        () =>
          document
            .getElementById("letterbox")
            ?.addEventListener("contextmenu", function (event) {
              event.preventDefault();
            }),
        250,
      );
    } else if (this.camera) {
      this.camera.position.copy(this.last_cam_pos);
      this.camera.rotation.copy(this.last_cam_rot);
      if (this.lockControls) {
        this.deps.getThreeScene().remove(this.lockControls.getObject());
      }
      this.cam_obj.scale.set(1, 1, 1);

      const hot = this.deps.getHotItems();
      if (hot) {
        hot.forEach((element) => {
          element.visible = true;
        });
      }

      this.deps.hideObjectPanel();
      this.deps.setEditorState(EditorStates.EDIT);
    }
  }

  setFreeCamState(state: FreeCamControlState | null) {
    this.freeCamState = state;
  }

  getCameraPersonMode(): boolean {
    return this.camera_person_mode;
  }

  // FOV from focal length using a 24mm sensor height by default.
  focalLengthToFov(focalLength: number, sensorHeight: number = 24): number {
    return 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
  }

  getRenderDimensions(): RenderDimensions {
    switch (this.render_camera_aspect_ratio) {
      case CameraAspectRatio.HORIZONTAL_16_9:
        return { width: 1280, height: 720, aspectRatio: 16 / 9 };
      case CameraAspectRatio.HORIZONTAL_3_2:
        return { width: 1200, height: 800, aspectRatio: 3 / 2 };
      case CameraAspectRatio.VERTICAL_2_3:
        return { width: 800, height: 1200, aspectRatio: 2 / 3 };
      case CameraAspectRatio.VERTICAL_9_16:
        return { width: 720, height: 1280, aspectRatio: 9 / 16 };
      case CameraAspectRatio.SQUARE_1_1:
      default:
        return { width: 1080, height: 1080, aspectRatio: 1 };
    }
  }

  changeRenderCameraAspectRatio(newAspectRatio: CameraAspectRatio) {
    this.render_camera_aspect_ratio = newAspectRatio;
    const { width, height, aspectRatio } = this.getRenderDimensions();
    this.render_width = width;
    this.render_height = height;
    if (this.render_camera) {
      this.render_camera.aspect = aspectRatio;
      this.render_camera.updateProjectionMatrix();
    }
  }

  // Camera-side of the per-frame render loop. Pulls FOV from the store's
  // selected camera entry, integrates FreeCam input back into the live
  // camera, mirrors the active camera's transform to cam_obj (or vice
  // versa in camera-person mode), and syncs render_camera to cam_obj.
  tickPerFrame(deltaSeconds: number) {
    const selectedCameraId = this.deps.getSelectedCameraId();

    if (selectedCameraId && this.camera) {
      const cameras = this.deps.getCameras();
      const camData = cameras.find((c) => c.id === selectedCameraId);
      if (camData) {
        const fov = this.focalLengthToFov(camData.focalLength);
        if (this.camera.fov !== fov) {
          this.camera.fov = fov;
          this.camera.updateProjectionMatrix();
        }
      }
    }

    if (this.freeCamState && this.camera) {
      const moved = freeCamFrameTick(
        this.camera,
        this.freeCamState,
        5 * deltaSeconds,
      );
      // Mirror the active camera's transform back into the store so
      // PromptBox3D and the camera-list UI stay in sync.
      if (moved && selectedCameraId) {
        const lookAt = lookAtFromCamera(this.camera);
        const pos = this.camera.position;
        const rot = this.camera.rotation;
        this.deps.bus.emit(
          new CameraUpdatedEvent(selectedCameraId, {
            position: { x: pos.x, y: pos.y, z: pos.z },
            rotation: { x: rot.x, y: rot.y, z: rot.z },
            lookAt: { x: lookAt.x, y: lookAt.y, z: lookAt.z },
          }),
        );
      }
    }

    if (this.camera_person_mode) {
      if (this.cam_obj && this.camera) {
        // Without a timeline scrubber, edits in camera-person mode write
        // back into cam_obj rather than copying out of it.
        this.cam_obj.position.copy(this.camera.position);
        this.cam_obj.rotation.copy(this.camera.rotation);
        this.cam_obj.visible = false;
      }
    } else if (this.cam_obj) {
      this.cam_obj.visible = true;
    }

    if (this.render_camera && this.cam_obj) {
      this.render_camera.position.copy(this.cam_obj.position);
      this.render_camera.rotation.copy(this.cam_obj.rotation);
      this.cam_obj.scale.copy(new THREE.Vector3(1, 1, 1));
    }
  }
}
