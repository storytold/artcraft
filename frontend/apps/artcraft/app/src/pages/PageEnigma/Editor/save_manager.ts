import * as THREE from "three";
import { SceneGenereationMetaData } from "../models/sceneGenerationMetadata";
import { StoryTellerProxyScene } from "../proxy/storyteller_proxy_scene";

import {
  setCameraAspectRatio,
  hideEditorLoader,
  restoreSceneGenerationMetadata,
  showEditorLoader,
  globalIPAMediaToken,
} from "../signals";
import Editor from "./editor";
import { getArtStyle } from "~/enums";
import { cameras, selectedCameraId, Camera } from "../signals/camera";

export type EditorInitializeConfig = {
  sceneToken: string;
};

// need to move this into the
export class SaveManager {
  editor: Editor;
  constructor(editor: Editor) {
    this.editor = editor;
  }

  async computeHashForBrowser(data: string): Promise<string> {
    // Encode the string data to a Uint8Array
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    // Compute the hash using the SubtleCrypto.digest method
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);

    // Convert the ArrayBuffer to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex;
  }

  public async computeSceneChecksum(): Promise<string> {
    const jsonString = await this.checkSumData();
    return this.computeHashForBrowser(jsonString);
  }

  private async checkSumData(): Promise<string> {
    const proxyScene = new StoryTellerProxyScene(
      this.editor.version,
      this.editor.activeScene,
    );
    const scene_json = await proxyScene.saveToScene(this.editor.version);

    const check_sum_data = {
      scene: scene_json,
      timeline: "",
      camera_data: {
        position: this.editor.camera?.position,
        rotation: this.editor.camera?.rotation,
      },
    };
    const jsonString = JSON.stringify(check_sum_data);
    return jsonString;
  }

  // JSON structure should and can return snapshot
  public async saveData({
    sceneGenerationMetadata,
  }: {
    sceneTitle: string;
    sceneToken?: string;
    sceneGenerationMetadata: SceneGenereationMetaData;
  }): Promise<string> {
    const proxyScene = new StoryTellerProxyScene(
      this.editor.version,
      this.editor.activeScene,
    );
    const scene_json = await proxyScene.saveToScene(this.editor.version);

    // Save all cameras data
    const camerasData = cameras.value.map((cam: Camera) => ({
      id: cam.id,
      label: cam.label,
      focalLength: cam.focalLength,
      position: cam.position,
      rotation: cam.rotation,
      lookAt: cam.lookAt,
    }));

    const save_data = {
      version: this.editor.version,
      scene: scene_json,
      ...sceneGenerationMetadata,
      timeline: "",
      skybox: this.editor.activeScene.skybox,
      camera_data: {
        position: this.editor.camera?.position,
        rotation: this.editor.camera?.rotation,
      },
      // Add cameras array and selected camera
      cameras: camerasData,
      selectedCameraId: selectedCameraId.value,
    };
    // take json scene and figure out checksum
    const jsonString = JSON.stringify(save_data);
    return jsonString;
  }

  public getSceneJson({
    sceneGenerationMetadata,
  }: {
    sceneGenerationMetadata: SceneGenereationMetaData;
  }) {
    const proxyScene = new StoryTellerProxyScene(
      this.editor.version,
      this.editor.activeScene,
    );
    const scene_json = proxyScene.saveToScene(this.editor.version);
    console.log(scene_json);

    // Save all cameras data
    const camerasData = cameras.value.map((cam: Camera) => ({
      id: cam.id,
      label: cam.label,
      focalLength: cam.focalLength,
      position: cam.position,
      rotation: cam.rotation,
      lookAt: cam.lookAt,
    }));

    const save_data = {
      version: this.editor.version,
      scene: scene_json,
      ...sceneGenerationMetadata,
      timeline: "",
      skybox: this.editor.activeScene.skybox,
      camera_data: {
        position: this.editor.camera?.position,
        rotation: this.editor.camera?.rotation,
      },
      // Add cameras array and selected camera
      cameras: camerasData,
      selectedCameraId: selectedCameraId.value,
    };

    return save_data;
  }

  // TODO Move this function into scene manager.
  public async saveScene({
    sceneTitle,
    sceneToken,
    sceneGenerationMetadata,
  }: {
    sceneTitle: string;
    sceneToken?: string;
    sceneGenerationMetadata: SceneGenereationMetaData;
  }): Promise<string> {
    this.editor.generating_preview = true; // Set this to true to stop control panel from flipping out.
    // remove controls when saving scene.
    this.editor.utils.removeTransformControls();
    showEditorLoader();

    const sceneJson = this.getSceneJson({
      sceneGenerationMetadata,
    });

    // TODO turn scene information into and object ...
    let sceneThumbnail = undefined;

    if (this.editor.renderer) {
      const imgData = this.editor.renderer.domElement.toDataURL();
      const response = await fetch(imgData); // Fetch the data URL
      sceneThumbnail = await response.blob(); // Convert to Blob
    }

    const result = await this.editor.api_manager.saveSceneState({
      saveJson: JSON.stringify(sceneJson),
      sceneTitle,
      sceneToken,
      sceneThumbnail,
    });

    // this means error going to have to fix the plumbing on this because not using
    // the api manager

    hideEditorLoader();

    this.editor.generating_preview = false; // FIX THIS LATER WITH VICCCCCCCCCCCCCCCTORRRRRRRR

    console.debug("Save Scene Result: ", result);
    return result; // if this is an empty string it is an error. need to migrate to api manager.
  }

  private async loadFromJson(scene_json: any) {
    const proxyScene = new StoryTellerProxyScene(
      this.editor.version,
      this.editor.activeScene,
    );

    await proxyScene.loadFromSceneJson(
      scene_json["scene"],
      scene_json["skybox"],
      scene_json["version"],
    );

    const camera_data = scene_json["camera_data"];
    if (camera_data && this.editor.camera) {
      const camera_position: THREE.Vector3 = camera_data["position"];
      const camera_rotation: THREE.Euler = camera_data["rotation"];

      this.editor.camera.position.copy(camera_position);
      this.editor.camera.rotation.copy(camera_rotation);
    }

    // Restore cameras data
    if (scene_json.cameras) {
      cameras.value = scene_json.cameras.map((cam: Camera) => ({
        id: cam.id,
        label: cam.label,
        focalLength: cam.focalLength,
        position: cam.position,
        rotation: cam.rotation,
        lookAt: cam.lookAt,
      }));
    }

    // Restore selected camera
    if (scene_json.selectedCameraId) {
      selectedCameraId.value = scene_json.selectedCameraId;
    }

    // For Remixing Scenes.
    // this calls the signal function to propagate the data to the UI
    restoreSceneGenerationMetadata(scene_json);
    // these propogate the values into the editor
    if (scene_json.globalIpAdapterImageMediaToken) {
      // this should be populated right after
      globalIPAMediaToken.value = scene_json.globalIpAdapterImageMediaToken;
    }
    if (scene_json.positivePrompt) {
      this.editor.positive_prompt = scene_json.positivePrompt;
    }
    if (scene_json.negativePrompt) {
      this.editor.negative_prompt = scene_json.negativePrompt;
    }
    if (scene_json.artisticStyle) {
      this.editor.art_style = getArtStyle(scene_json["artisticStyle"]);
    }
    if (scene_json.cameraAspectRatio) {
      //editor propagation
      this.editor.changeRenderCameraAspectRatio(scene_json.cameraAspectRatio);
      //signal propagation
      setCameraAspectRatio(scene_json.cameraAspectRatio);
    }

    this.editor.version = scene_json["version"];
    this.editor.cam_obj = this.editor.activeScene.get_object_by_name(
      this.editor.camera_name,
    );

    this.editor.cam_obj?.layers.set(1);
    this.editor.cam_obj?.children.forEach((child) => {
      child.layers.set(1);
    });

  }

  public async loadCache(cacheJson: string) {
    showEditorLoader();

    const scene_json = JSON.parse(cacheJson);
    await this.loadFromJson(scene_json);

    hideEditorLoader();
  }

  // TODO Refactor remove editor.
  public async loadScene(scene_media_token: string) {
    showEditorLoader();

    this.editor.current_scene_media_token = scene_media_token;

    const scene_json = await this.editor.api_manager
      .loadSceneState(this.editor.current_scene_media_token)
      .catch((err) => {
        hideEditorLoader();
        throw err;
      });

    await this.loadFromJson(scene_json);

    hideEditorLoader();
  }
}
