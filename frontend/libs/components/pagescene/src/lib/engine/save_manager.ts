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

// Per-load cancellation handle. Captured in closure by every in-flight
// load task; flipped when the load is superseded (a newer load begins
// or the editor unmounts). Late-arriving asset promises read `cancelled`
// at await boundaries and bail without mutating the scene. The
// `signal` plumbs through to per-asset fetchAsset calls so we also
// terminate in-flight binary downloads, saving bandwidth.
export type LoadTicket = { cancelled: boolean; signal: AbortSignal };

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

  // Active load handle, if any. Used to cancel the previous load when
  // a new one starts (rapid re-load / applyJson during loadScene) or
  // when the editor unmounts.
  private currentLoad?: { ticket: LoadTicket; controller: AbortController };

  constructor(private readonly deps: SaveManagerDeps) {}

  // Cancel any in-flight load. Called by Editor.unmountEngine so late-
  // arriving asset promises bail at their next checkpoint and don't
  // touch the about-to-be-disposed scene.
  public cancelCurrentLoad() {
    if (!this.currentLoad) return;
    this.currentLoad.ticket.cancelled = true;
    this.currentLoad.controller.abort();
    this.currentLoad = undefined;
  }

  // Mint a fresh ticket + AbortController for a new load. Cancels and
  // replaces any previous in-flight load on this SaveManager so two
  // overlapping loads can't both apply to the scene.
  private startLoad(): LoadTicket {
    if (this.currentLoad) {
      this.currentLoad.ticket.cancelled = true;
      this.currentLoad.controller.abort();
    }
    const controller = new AbortController();
    const ticket: LoadTicket = { cancelled: false, signal: controller.signal };
    this.currentLoad = { ticket, controller };
    return ticket;
  }

  // Tear down the load handle if it's still ours. Late-arriving promises
  // from a *previous* load may have already replaced this.currentLoad —
  // we mustn't clobber the newer ticket in that case.
  private endLoad(ticket: LoadTicket) {
    if (this.currentLoad?.ticket === ticket) {
      this.currentLoad = undefined;
    }
  }

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

    // Capture the thumbnail in parallel with the JSON.stringify of the
    // scene. canvas.toBlob yields a Blob directly, no toDataURL →
    // fetch → blob roundtrip. Adapters fire-and-forget the cover-image
    // PATCH internally, so this doesn't extend the save's critical path.
    const sceneThumbnailPromise = captureCanvasThumbnail(
      this.deps.getRenderer(),
    );
    const saveJson = JSON.stringify(sceneJson);
    const sceneThumbnail = await sceneThumbnailPromise;

    const result = await this.deps.saveSceneState({
      saveJson,
      sceneTitle,
      sceneToken,
      sceneThumbnail,
    });

    this.deps.bus.emit(new EditorLoaderEvent(false));
    console.debug("Save Scene Result: ", result);
    return result;
  }

  public async loadCache(cacheJson: string): Promise<{ applied: boolean }> {
    const ticket = this.startLoad();
    this.deps.bus.emit(new EditorLoaderEvent(true));
    try {
      const scene_json = JSON.parse(cacheJson);
      const applied = await this.loadFromJson(scene_json, ticket);
      return { applied };
    } finally {
      this.endLoad(ticket);
      // Only dismiss the spinner if we're not being superseded — the
      // newer load just emitted its own EditorLoaderEvent(true) and
      // shouldn't have its spinner ripped away by our trailing emit.
      if (!ticket.cancelled) {
        this.deps.bus.emit(new EditorLoaderEvent(false));
      }
    }
  }

  public async loadScene(
    scene_media_token: string,
  ): Promise<{ applied: boolean }> {
    const ticket = this.startLoad();
    this.deps.bus.emit(new EditorLoaderEvent(true));
    this.currentSceneMediaToken = scene_media_token;
    try {
      const scene_json = await this.deps.loadSceneState(
        this.currentSceneMediaToken,
      );
      if (ticket.cancelled) return { applied: false };
      const applied = await this.loadFromJson(scene_json, ticket);
      return { applied };
    } finally {
      this.endLoad(ticket);
      if (!ticket.cancelled) {
        this.deps.bus.emit(new EditorLoaderEvent(false));
      }
    }
  }

  private async loadFromJson(
    scene_json: any,
    ticket: LoadTicket,
  ): Promise<boolean> {
    const version = this.deps.getVersion();
    const scene = this.deps.getActiveScene();
    const proxyScene = new StoryTellerProxyScene(version, scene);

    await proxyScene.loadFromSceneJson(
      scene_json["scene"],
      scene_json["skybox"],
      scene_json["version"],
      ticket,
    );
    if (ticket.cancelled) return false;

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
    return true;
  }
}

// Snapshot the renderer's canvas as a PNG Blob. canvas.toBlob hands us
// the image asynchronously without the toDataURL → base64 → fetch →
// blob roundtrip the previous code path used, and yields the main
// thread to the browser during encoding.
function captureCanvasThumbnail(
  renderer: THREE.WebGLRenderer | undefined,
): Promise<Blob | undefined> {
  if (!renderer) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    renderer.domElement.toBlob((blob) => resolve(blob ?? undefined), "image/png");
  });
}
