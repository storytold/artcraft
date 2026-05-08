import * as THREE from "three";
import { Camera } from "@storyteller/common";

import { SceneGenereationMetaData } from "../models/sceneGenerationMetadata";
import { StoryTellerProxyScene } from "../proxy/storyteller_proxy_scene";
import { CameraAspectRatio } from "../enums";
import type Scene from "./scene";
import type { EngineEventBus } from "./events/EngineEventBus";
import {
  CameraAspectRatioChangedEvent,
  CamerasReplacedEvent,
  EditorLoaderEvent,
  SelectedCameraChangedEvent,
} from "./events/EngineEvent";

export type EditorInitializeConfig = {
  sceneToken: string;
};

export type SaveSceneStateArgs = {
  saveJson: string;
  sceneTitle: string;
  sceneToken?: string;
  sceneThumbnail: Blob | undefined;
};

// Narrow contract between SaveManager and the rest of the engine. The
// manager doesn't import Editor — every cross-subsystem reach is a
// callback or getter on this deps object (Phase 2 idiom).
export type SaveManagerDeps = {
  // Engine version. Read on save, written on load (older formats may
  // upgrade themselves through this).
  getVersion: () => number;
  setVersion: (v: number) => void;

  // Active scene reference for proxy serialization.
  getActiveScene: () => Scene;

  // Renderer canvas — only used to capture the save-thumbnail.
  getRenderer: () => THREE.WebGLRenderer | undefined;

  // Yank the transform gizmo before snapshot so it doesn't end up in
  // the saved scene.
  removeTransformControls: () => void;

  // Camera state. getCamera reads pose for save + load-restore;
  // refreshCamObj re-anchors the camera-person object after a load
  // replaces the scene; changeRenderCameraAspectRatio applies a saved
  // aspect ratio.
  getCamera: () => THREE.PerspectiveCamera | null;
  refreshCamObj: () => void;
  changeRenderCameraAspectRatio: (ratio: CameraAspectRatio) => void;

  // Editor field setter used during load.
  setPositivePrompt: (prompt: string) => void;

  // Backend API.
  saveSceneState: (args: SaveSceneStateArgs) => Promise<string>;
  loadSceneState: (token: string) => Promise<unknown>;

  // Camera state. Reads happen at the engine→store boundary so the
  // SaveManager itself stays store-agnostic.
  getCameras: () => Camera[];
  getSelectedCameraId: () => string;

  // Typed event bus — every engine→store write goes through here.
  bus: EngineEventBus;
};

export class SaveManager {
  // Token of the most-recently loaded scene. Internal load tracking
  // — nothing outside SaveManager reads it.
  private currentSceneMediaToken: string | null = null;

  constructor(private readonly deps: SaveManagerDeps) {}

  public getSceneJson({
    sceneGenerationMetadata,
  }: {
    sceneGenerationMetadata: SceneGenereationMetaData;
  }) {
    const version = this.deps.getVersion();
    const scene = this.deps.getActiveScene();
    const camera = this.deps.getCamera();
    const proxyScene = new StoryTellerProxyScene(version, scene);
    const scene_json = proxyScene.saveToScene(version);

    const camerasData = this.deps.getCameras().map((cam: Camera) => ({
      id: cam.id,
      label: cam.label,
      focalLength: cam.focalLength,
      position: cam.position,
      rotation: cam.rotation,
      lookAt: cam.lookAt,
    }));

    return {
      version,
      scene: scene_json,
      ...sceneGenerationMetadata,
      timeline: "",
      skybox: scene.skybox,
      camera_data: {
        position: camera?.position,
        rotation: camera?.rotation,
      },
      cameras: camerasData,
      selectedCameraId: this.deps.getSelectedCameraId(),
    };
  }

  public async saveScene({
    sceneTitle,
    sceneToken,
    sceneGenerationMetadata,
  }: {
    sceneTitle: string;
    sceneToken?: string;
    sceneGenerationMetadata: SceneGenereationMetaData;
  }): Promise<string> {
    this.deps.removeTransformControls();
    this.deps.bus.emit(new EditorLoaderEvent(true));

    const sceneJson = this.getSceneJson({ sceneGenerationMetadata });

    let sceneThumbnail: Blob | undefined = undefined;
    const renderer = this.deps.getRenderer();
    if (renderer) {
      const imgData = renderer.domElement.toDataURL();
      const response = await fetch(imgData);
      sceneThumbnail = await response.blob();
    }

    const result = await this.deps.saveSceneState({
      saveJson: JSON.stringify(sceneJson),
      sceneTitle,
      sceneToken,
      sceneThumbnail,
    });

    this.deps.bus.emit(new EditorLoaderEvent(false));
    console.debug("Save Scene Result: ", result);
    return result;
  }

  public async loadCache(cacheJson: string) {
    this.deps.bus.emit(new EditorLoaderEvent(true));
    const scene_json = JSON.parse(cacheJson);
    await this.loadFromJson(scene_json);
    this.deps.bus.emit(new EditorLoaderEvent(false));
  }

  public async loadScene(scene_media_token: string) {
    this.deps.bus.emit(new EditorLoaderEvent(true));
    this.currentSceneMediaToken = scene_media_token;
    const scene_json = await this.deps
      .loadSceneState(this.currentSceneMediaToken)
      .catch((err) => {
        this.deps.bus.emit(new EditorLoaderEvent(false));
        throw err;
      });
    await this.loadFromJson(scene_json);
    this.deps.bus.emit(new EditorLoaderEvent(false));
  }

  private async loadFromJson(scene_json: any) {
    const version = this.deps.getVersion();
    const scene = this.deps.getActiveScene();
    const proxyScene = new StoryTellerProxyScene(version, scene);

    await proxyScene.loadFromSceneJson(
      scene_json["scene"],
      scene_json["skybox"],
      scene_json["version"],
    );

    const camera_data = scene_json["camera_data"];
    const liveCamera = this.deps.getCamera();
    if (camera_data && liveCamera) {
      const camera_position: THREE.Vector3 = camera_data["position"];
      const camera_rotation: THREE.Euler = camera_data["rotation"];
      liveCamera.position.copy(camera_position);
      liveCamera.rotation.copy(camera_rotation);
    }

    if (scene_json.cameras) {
      const restored: Camera[] = scene_json.cameras.map((cam: Camera) => ({
        id: cam.id,
        label: cam.label,
        focalLength: cam.focalLength,
        position: cam.position,
        rotation: cam.rotation,
        lookAt: cam.lookAt,
      }));
      this.deps.bus.emit(new CamerasReplacedEvent(restored));
    }

    if (scene_json.selectedCameraId) {
      this.deps.bus.emit(
        new SelectedCameraChangedEvent(scene_json.selectedCameraId),
      );
    }

    if (scene_json.positivePrompt) {
      this.deps.setPositivePrompt(scene_json.positivePrompt);
    }
    if (scene_json.cameraAspectRatio) {
      this.deps.changeRenderCameraAspectRatio(scene_json.cameraAspectRatio);
      this.deps.bus.emit(
        new CameraAspectRatioChangedEvent(scene_json.cameraAspectRatio),
      );
    }

    this.deps.setVersion(scene_json["version"]);
    this.deps.refreshCamObj();
  }
}
