import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  freeCamFrameTick,
  lookAtFromCamera,
  type FreeCamControlState,
} from "./cameraMath";
import Scene from "./scene.js";
import { APIManager } from "./api_manager.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { CameraAspectRatio } from "~/pages/PageScene/enums";
import { AssetType, ClipGroup } from "~/enums";
import { XYZ } from "../datastructures/common";
import { SceneUtils } from "./helper";
import { MouseControls } from "./keybinds_controls";
import { SaveManager } from "./save_manager";
import {
  authentication,
  loadingBarData,
  loadingBarIsShowing,
  signalScene,
} from "~/signals";

import { SceneGenereationMetaData } from "../models/sceneGenerationMetadata";
import { MediaUploadApi } from "~/Classes/ApiManager";
import { SceneManager } from "./scene_manager_api";
import { ViewportController } from "./editor/ViewportController";
import { PostProcessingPipeline } from "./editor/PostProcessingPipeline";
import { GizmoController } from "./editor/GizmoController";

import Stats from "three/examples/jsm/libs/stats.module.js";
import { SparkRenderer } from "@sparkjsdev/spark";
import { usePageSceneStore } from "../PageSceneStore";

export type EditorInitializeConfig = {
  sceneToken: string;
  editorCanvasEl: HTMLCanvasElement;
  camViewCanvasEl: HTMLCanvasElement;
  sceneContainerEl: HTMLDivElement;
  cacheJsonString?: string;
};

// Lifecycle flags now live on PageSceneStore. These re-exports preserve
// the call sites that already consume the setters by name (TopBar, etc).
export const set3DPageMounted = (isMounted: boolean) =>
  usePageSceneStore.getState().set3DPageMounted(isMounted);
export const setIs3DEditorInitialized = (isInitialized: boolean) =>
  usePageSceneStore.getState().setIs3DEditorInitialized(isInitialized);
export const setIs3DSceneLoaded = (isLoaded: boolean) =>
  usePageSceneStore.getState().setIs3DSceneLoaded(isLoaded);

class Editor {
  version: number;
  activeScene: Scene;
  camera: THREE.PerspectiveCamera | null = null;
  render_camera: THREE.PerspectiveCamera | null = null;
  render_camera_aspect_ratio: CameraAspectRatio =
    CameraAspectRatio.HORIZONTAL_3_2;
  renderer: THREE.WebGLRenderer | undefined;
  sparkRenderer: SparkRenderer | null = null;
  rawRenderer: THREE.WebGLRenderer | undefined;
  clock: THREE.Clock | undefined;

  last_cam_pos: THREE.Vector3;
  last_cam_rot: THREE.Euler;
  raycaster: THREE.Raycaster | undefined;
  mouse: THREE.Vector2 | undefined;
  selected: THREE.Object3D | undefined;
  last_selected: THREE.Object3D | undefined;
  last_selected_sum: number | undefined;
  rendering: boolean;
  api_manager: APIManager;
  freeCamState: FreeCamControlState | null = null;
  setFreeCamState(state: FreeCamControlState | null) {
    this.freeCamState = state;
  }
  orbitControls: OrbitControls | undefined;
  locked: boolean;

  render_timer: number;
  fps_number: number;
  cap_fps: number;
  lockControls: PointerLockControls | undefined;
  cam_obj: THREE.Object3D | undefined;
  camera_last_pos: THREE.Vector3;
  frames: number;
  lastFrameTime: number;

  camera_person_mode: boolean;
  current_scene_media_token: string | null;
  current_scene_glb_media_token: string | null;

  can_initialize: boolean;
  switchPreviewToggle: boolean;

  // dispatchAppUiState: React.Dispatch<AppUiAction>;
  // userToken: string;
  // signalScene: (data: any) => void;
  // getSceneSignals: () => SceneSignal;
  render_width: number;
  render_height: number;

  positive_prompt: string;
  generating_preview: boolean = false;

  recorder: MediaRecorder | undefined;

  // Owns canvas/container DOM refs and the resize cascade.
  viewport: ViewportController;
  // Owns the EffectComposer chains and post-process passes.
  postProcessing: PostProcessingPipeline;
  // Owns the TransformControls gizmo.
  gizmo: GizmoController;

  selectedCanvas: boolean;
  startRenderHeight: number;
  startRenderWidth: number;
  // Default params.

  // global names of scene entities
  camera_name: string;

  utils: SceneUtils;
  mouse_controls: MouseControls | undefined;
  save_manager: SaveManager;

  media_upload: MediaUploadApi;

  sceneManager: SceneManager | undefined;

  ///////////////////////////////////////////////
  ///////////////////////////////////////////////

  public outliner_feature_flag: boolean;

  ///////////////////////////////////////////////
  ///////////////////////////////////////////////

  focused: boolean = false;

  renderIndex: number;
  // this should be set in the future to extend the lenght of the track for rendering engine
  globalSetTrackLengthSeconds: number;

  // this is to prevent recording processing from happening twice there is an update loop bug at its core.
  processingRecording: boolean;

  // this is to catch and ensure that caching doesn't break the app.
  // this happens because we can error out during the video generation process and things will cache despite that failing.
  processingHasFailed: boolean;
  stats: Stats;

  // Allows us to cancel the queued render
  private renderEventToken: number;
  private shouldRender: boolean;
  private isMounted: boolean = false;
  private _isEngineDataLoaded: boolean = false;
  isEngineDataLoaded() {
    return this._isEngineDataLoaded;
  }

  constructor() {
    this.processingHasFailed = false;
    console.log(
      "If you see this message twice! then it rendered twice, if you see it once it's all good.",
    );
    this.can_initialize = true;
    this.processingRecording = false;
    this.stats = new Stats();
    // TODO: REMOVE LATER WITH BETTER FIX FOR IMPORTING AMMOJS
    document.body.appendChild(
      Object.assign(document.createElement("script"), {
        src: "jsm/libs/ammo.wasm.js",
      }),
    );

    const newElement = document.createElement("div");
    newElement.id = "created-one-element";
    document.body.appendChild(newElement);
    // life cycle fix

    // Version and name.
    this.version = 2.0;
    // Clock, scene and camera essentials.
    // global names
    this.camera_name = "::CAM::";

    // PostProcessingPipeline must exist before Scene because Scene's
    // load paths invoke updateSurfaceIdAttributeToMesh as a callback.
    this.postProcessing = new PostProcessingPipeline();
    this.gizmo = new GizmoController();

    this.activeScene = new Scene(
      "" + this.version,
      this.camera_name,
      (scene: THREE.Scene) =>
        this.postProcessing.updateSurfaceIdAttributeToMesh(scene),
      this.version,
    );
    this.activeScene.initialize();
    this.last_cam_pos = new THREE.Vector3(0, 0, 0);
    this.last_cam_rot = new THREE.Euler(0, 0, 0);
    this.camera_last_pos = new THREE.Vector3(0, 0, 0);
    this.startRenderWidth = 0;
    this.startRenderHeight = 0;
    this.rendering = false;
    this.switchPreviewToggle = false;
    this.api_manager = new APIManager();
    this.camera_person_mode = false;
    this.locked = false;
    this.render_timer = 0;
    this.fps_number = 60;
    this.cap_fps = 60;
    this.frames = 0;
    this.lastFrameTime = 0;
    this.last_selected_sum = 0;
    this.selectedCanvas = false;
    this.renderEventToken = -1;
    this.shouldRender = false;

    this.render_camera_aspect_ratio = CameraAspectRatio.HORIZONTAL_3_2;
    this.render_width = this.getRenderDimensions().width;
    this.render_height = this.getRenderDimensions().height;

    this.utils = new SceneUtils(this, this.activeScene);
    this.save_manager = new SaveManager(this);
    this.viewport = new ViewportController({
      getCamera: () => this.camera,
      getRenderCamera: () => this.render_camera,
      getRenderer: () => this.renderer,
      getRenderAspectRatio: () => this.getRenderDimensions().aspectRatio,
      resizePostProcessing: (w, h) => this.postProcessing.resize(w, h),
    });

    // Scene State
    this.current_scene_media_token = null;
    this.current_scene_glb_media_token = null;

    this.positive_prompt =
      "((masterpiece, best quality, 8K, detailed)), colorful, epic, fantasy, (fox, red fox:1.2), no humans, 1other, ((koi pond)), outdoors, pond, rocks, stones, koi fish, ((watercolor))), lilypad, fish swimming around.";

    this.media_upload = new MediaUploadApi();
    // TODO REMOVE
    this.outliner_feature_flag = true;

    // New Rendering Pipeline Engine Work
    this.globalSetTrackLengthSeconds = 7;

    // set image type at this stage

    this.renderIndex = 0;
  }

  // Add helper method to convert focal length to FOV
  focalLengthToFov(focalLength: number, sensorHeight: number = 24): number {
    // Using the formula: FOV = 2 * arctan(sensorHeight / (2 * focalLength))
    return 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
  }

  getRenderDimensions() {
    switch (this.render_camera_aspect_ratio) {
      case CameraAspectRatio.HORIZONTAL_16_9: {
        return {
          width: 1280,
          height: 720,
          aspectRatio: 16 / 9,
        };
      }
      case CameraAspectRatio.HORIZONTAL_3_2: {
        return {
          width: 1200,
          height: 800,
          aspectRatio: 3 / 2,
        };
      }
      case CameraAspectRatio.VERTICAL_2_3: {
        return {
          width: 800,
          height: 1200,
          aspectRatio: 2 / 3,
        };
      }
      case CameraAspectRatio.VERTICAL_9_16: {
        return {
          width: 720,
          height: 1280,
          aspectRatio: 9 / 16,
        };
      }
      case CameraAspectRatio.SQUARE_1_1:
      default: {
        return {
          width: 1080,
          height: 1080,
          aspectRatio: 1,
        };
      }
    }
  }
  isEmpty(value: string | null) {
    return value === null || value.trim().length === 0;
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

  initialize({
    sceneToken,
    editorCanvasEl,
    camViewCanvasEl,
    sceneContainerEl,
    cacheJsonString: cacheJson = "",
  }: EditorInitializeConfig) {
    if (!this.can_initialize) {
      console.log("3D editor is already initialized");
      return;
    }

    this._isEngineDataLoaded = false;
    this.can_initialize = false;

    // This is to prevent recording processing from happening twice there is an update loop bug at its core.
    this.processingRecording = false;

    // Gets the canvas.
    this.viewport.canvReference = editorCanvasEl;
    this.viewport.canvasRenderCamReference = camViewCanvasEl;

    // Find the container element
    this.viewport.container = sceneContainerEl;

    // Use the container's dimensions
    const width = this.viewport.container.offsetWidth;
    const height = this.viewport.container.offsetHeight;

    // Sets up camera and base position using camera configurations from the store.
    const mainCameraConfig = usePageSceneStore
      .getState()
      .cameras.find((cam) => cam.id === "main");
    if (mainCameraConfig) {
      this.camera = new THREE.PerspectiveCamera(
        this.focalLengthToFov(mainCameraConfig.focalLength),
        width / height,
        0.1,
        2000,
      );
      this.camera.position.set(
        mainCameraConfig.position.x,
        mainCameraConfig.position.y,
        mainCameraConfig.position.z,
      );
      this.camera.lookAt(
        mainCameraConfig.lookAt.x,
        mainCameraConfig.lookAt.y,
        mainCameraConfig.lookAt.z,
      );
    }

    this.camera.layers.enable(0);
    this.camera.layers.enable(1);

    const otherCameras = usePageSceneStore
      .getState()
      .cameras.filter((cam) => cam.id !== "main");
    if (otherCameras.length > 0) {
      const renderCameraConfig = otherCameras[0];
      this.render_camera = new THREE.PerspectiveCamera(
        this.focalLengthToFov(renderCameraConfig.focalLength),
        width / height,
        0.01,
        200,
      );
      this.render_camera.position.set(
        renderCameraConfig.position.x,
        renderCameraConfig.position.y,
        renderCameraConfig.position.z,
      );
      this.render_camera.lookAt(
        renderCameraConfig.lookAt.x,
        renderCameraConfig.lookAt.y,
        renderCameraConfig.lookAt.z,
      );
    }

    this.render_camera.layers.disable(1); // This camera does not see this layer      );

    // Base WebGL render and clock for delta time.
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.viewport.canvReference,
      preserveDrawingBuffer: true,
    });

    // this.sparkRenderer = new SparkRenderer({
    //   renderer: this.renderer,
    //   autoUpdate: true,
    // });

    this.rawRenderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.viewport.canvasRenderCamReference,
      preserveDrawingBuffer: true,
    });

    this.renderer.shadowMap.enabled = true;
    this.clock = new THREE.Clock();

    // Resizes the renderer.
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.postProcessing.configureMain(
      this.renderer,
      this.activeScene.scene,
      this.camera,
      this.viewport.canvReference?.width ?? 0,
      this.viewport.canvReference?.height ?? 0,
    );
    // Controls and movement.

    this.lockControls = new PointerLockControls(
      this.camera,
      this.renderer.domElement,
    );
    // FreeCam math + listeners now live in hooks/useFreeCam.ts; the
    // editor reads `freeCamState` (set by that hook) on every render.

    this.gizmo.configure(
      this.camera,
      this.renderer.domElement,
      this.activeScene.scene,
      {
        onChange: () => this.renderScene(),
        onDraggingChanged: (dragging) => {
          this.updateSelectedUI();
          this.camera_last_pos.copy(new THREE.Vector3(-99999, -99999, -99999));
          this.focused = !dragging;
        },
      },
    );

    this.raycaster = new THREE.Raycaster();
    // Configure raycaster to check both layers
    this.raycaster.layers.set(0); // Enable default layer
    this.raycaster.layers.enable(1); // Also check objects on the custom layer

    this.mouse = new THREE.Vector2();
    // Resets canvas size.
    this.viewport.onWindowResize();

    this.viewport.setupResizeObserver();

    // saving state of the scene
    this.current_scene_media_token = null;
    this.current_scene_glb_media_token = null;

    this.cam_obj = this.activeScene.get_object_by_name(this.camera_name);

    this.mouse_controls = new MouseControls(
      this.camera,
      this.get_camera_person_mode.bind(this),
      this.freeCamState,
      this.lockControls,
      this.camera_last_pos,
      this.selectedCanvas,
      this.switchPreviewToggle,
      this.rendering,
      this.togglePlayback.bind(this),
      this.deleteObject.bind(this),
      this.viewport.canvReference,
      this.mouse,
      this.mouse,
      this.raycaster,
      this.gizmo.control,
      this.postProcessing.outlinePass,
      this.activeScene.scene,
      this.publishSelect.bind(this),
      this.updateSelectedUI.bind(this),
      false,
      this.last_selected,
      this.getAssetType.bind(this),
      this.setSelected.bind(this),
      this.isMovable.bind(this),
      this.enable_stats.bind(this),
    );

    if (this.outliner_feature_flag) {
      this.sceneManager = new SceneManager(
        this.version,
        this.mouse_controls,
        this.activeScene,
        true,
        this.updateOutliner.bind(this),
        this.isCharacterUuid.bind(this),
      ); // Enabled dev mode.
      this.mouse_controls.sceneManager = this.sceneManager;
    }

    // Add spark renderer as a child of the camera
    // this.activeScene.scene.add(this.sparkRenderer);
    // this.camera?.add(this.sparkRenderer);

    const onloadCallback = () => {
      console.log("Setting Scene is loaded");
      this._isEngineDataLoaded = true;

      if (this.outliner_feature_flag) {
        const result = this.sceneManager?.render_outliner(
          this.getCharactersByUuid(),
        );
        if (result) usePageSceneStore.getState().setOutlinerItems(result.items);
      }

      setIs3DSceneLoaded(true);
    };

    if (!this.utils.isEmpty(cacheJson)) {
      this.loadCache(cacheJson).then(onloadCallback);
    } else if (!this.utils.isEmpty(sceneToken)) {
      this.loadScene(sceneToken).then(onloadCallback);
    } else {
      signalScene({
        title: "Untitled New Scene",
        token: undefined,
        ownerToken: authentication.userInfo.value?.user_token,
        isModified: false,
      });
      onloadCallback();
    }

    this.postProcessing.configureRaw(
      this.rawRenderer,
      this.activeScene.scene,
      this.render_camera,
      this.viewport.canvasRenderCamReference?.width ?? 0,
      this.viewport.canvasRenderCamReference?.height ?? 0,
    );

    loadingBarData.value = {
      ...loadingBarData.value,
      progress: 100,
    };
    loadingBarIsShowing.value = false;

    setIs3DEditorInitialized(true);

    // This will enable all event and render loops
    // We'll disable it here so the UI events can control is manually
    this.remountEngine();
  }

  public isMovable(): boolean {
    return this.focused;
  }

  public enable_stats() {
    document.body.appendChild(this.stats.dom);
  }


  // Captures the scene without the grid
  public snapShotOfCurrentFrame(shouldDownload: boolean = true) {
    if (!this.renderer?.domElement || !this.camera) {
      console.error("Error: Renderer or camera not available.");
      return null;
    }

    const store = usePageSceneStore.getState();
    const currentAspectRatio = store.cameraAspectRatio;

    // Store grid visibility state and hide grid
    const wasGridVisible = store.gridVisible;
    store.setGridVisible(false);

    // Store and hide transform controls
    const wasControlVisible = this.gizmo.isVisible();
    this.gizmo.setVisible(false);

    // Store and disable outline pass
    const outlinePass = this.postProcessing.outlinePass;
    const wasOutlineEnabled = outlinePass?.enabled ?? false;
    if (outlinePass) {
      outlinePass.enabled = false;
    }

    // High quality dimensions for each aspect ratio
    let targetWidth: number;
    let targetHeight: number;
    let aspectRatio: number;

    switch (currentAspectRatio) {
      case CameraAspectRatio.HORIZONTAL_16_9:
        targetWidth = 1280;
        targetHeight = 720;
        aspectRatio = 16 / 9;
        break;
      case CameraAspectRatio.VERTICAL_9_16:
        targetWidth = 720;
        targetHeight = 1280;
        aspectRatio = 9 / 16;
        break;
      case CameraAspectRatio.HORIZONTAL_3_2:
        targetWidth = 1536;
        targetHeight = 1024;
        aspectRatio = 3 / 2;
        break;
      case CameraAspectRatio.VERTICAL_2_3:
        targetWidth = 1024;
        targetHeight = 1536;
        aspectRatio = 2 / 3;
        break;
      case CameraAspectRatio.SQUARE_1_1:
      default:
        targetWidth = 1024;
        targetHeight = 1024;
        aspectRatio = 1;
        break;
    }

    // Store original renderer and camera state
    const sizeVector = new THREE.Vector2();
    this.renderer.getSize(sizeVector);

    const originalWidth = sizeVector.x;
    const originalHeight = sizeVector.y;
    const originalPixelRatio = this.renderer.getPixelRatio();
    const originalCameraAspect = this.camera.aspect;
    const originalRenderCameraAspect =
      this.render_camera?.aspect || originalCameraAspect;

    // Temporarily set renderer to high resolution
    this.renderer.setSize(targetWidth, targetHeight, false);
    this.renderer.setPixelRatio(1);

    // Update camera for the new aspect ratio
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();

    // If using render camera, update it too
    if (this.render_camera) {
      this.render_camera.aspect = aspectRatio;
      this.render_camera.updateProjectionMatrix();
    }

    // Re-render the scene at high resolution
    if (this.postProcessing.composer) {
      this.postProcessing.composer.setSize(targetWidth, targetHeight);
      this.postProcessing.composer.render();
    } else {
      this.renderer.render(this.activeScene.scene, this.camera);
    }

    // Get the high resolution snapshot
    const snapshot = this.renderer.domElement.toDataURL("image/png", 1.0);
    const base64Snapshot = snapshot.split(",")[1];

    // Restore original camera aspect
    this.camera.aspect = originalCameraAspect;
    this.camera.updateProjectionMatrix();

    // Restore render camera if it exists
    if (this.render_camera) {
      this.render_camera.aspect = originalRenderCameraAspect;
      this.render_camera.updateProjectionMatrix();
    }

    // Restore original renderer size and pixel ratio
    this.renderer.setSize(originalWidth, originalHeight, false);
    this.renderer.setPixelRatio(originalPixelRatio);

    // Re-render at original resolution
    if (this.postProcessing.composer) {
      this.postProcessing.composer.setSize(originalWidth, originalHeight);
      this.postProcessing.composer.render();
    } else {
      this.renderer.render(this.activeScene.scene, this.camera);
    }

    // Restore grid visibility
    usePageSceneStore.getState().setGridVisible(wasGridVisible);

    // Restore transform controls visibility
    this.gizmo.setVisible(wasControlVisible);

    // Restore outline pass
    if (outlinePass) {
      outlinePass.enabled = wasOutlineEnabled;
    }

    if (shouldDownload) {
      const link = document.createElement("a");
      link.download = "scene-snapshot.png";
      link.href = snapshot;
      link.click();
    }

    const byteString = atob(base64Snapshot);
    const mimeString = "image/png";
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const uuid = crypto.randomUUID();
    const file = new File([ab], `${uuid}.png`, { type: mimeString });
    return { base64Snapshot, file };
  }

  public async newScene(sceneTitleInput: string) {
    this.activeScene.clear();
    this.cam_obj = this.activeScene.get_object_by_name(this.camera_name);
    const sceneTitle =
      sceneTitleInput && sceneTitleInput !== ""
        ? sceneTitleInput
        : "Untitled New Scene";
    signalScene({
      title: sceneTitle,
      token: undefined,
      ownerToken: authentication.userInfo.value?.user_token,
      isModified: false,
    });
    usePageSceneStore.getState().resetScene();

    if (this.outliner_feature_flag) {
      const result = this.sceneManager?.render_outliner(
        this.getCharactersByUuid(),
      );
      if (result) usePageSceneStore.getState().setOutlinerItems(result.items);
    }
  }

  public async loadCache(cacheJson: string) {
    await this.save_manager.loadCache(cacheJson);
  }

  public async loadScene(scene_media_token: string) {
    await this.save_manager.loadScene(scene_media_token);

    if (this.outliner_feature_flag) {
      const result = this.sceneManager?.render_outliner(
        this.getCharactersByUuid(),
      );
      if (result) usePageSceneStore.getState().setOutlinerItems(result.items);
    }
  }

  setSelected(object: THREE.Object3D[] | undefined) {
    if (this.sceneManager) {
      this.sceneManager.selected_objects = object;
    }
  }

  isObjectLipsync(object_uuid: string) {
    return this.utils.isObjectLipsync(object_uuid);
  }

  isObjectLocked(object_uuid: string): boolean {
    return this.utils.isObjectLocked(object_uuid);
  }

  lockUnlockObject(object_uuid: string): boolean {
    const res = this.utils.lockUnlockObject(object_uuid);
    if (this.outliner_feature_flag) {
      this.updateSelectedUI();
    }
    return res;
  }

  setColor(object_uuid: string, hex_color: string) {
    this.activeScene.setColor(object_uuid, hex_color);
  }

  // TO UPDATE selected objects in the scene might want to add to the scene ...
  async setSelectedObject(position: XYZ, rotation: XYZ, scale: XYZ) {
    this.utils.setSelectedObject(position, rotation, scale);
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
    return await this.save_manager.saveScene({
      sceneTitle: sceneTitle,
      sceneToken: sceneToken,
      sceneGenerationMetadata: sceneGenerationMetadata,
    });
  }

  public cacheScene({
    sceneTitle,
    sceneToken,
    sceneGenerationMetadata,
  }: {
    sceneTitle: string;
    sceneToken: string;
    sceneGenerationMetadata: SceneGenereationMetaData;
  }) {
    return this.save_manager.getSceneJson({
      sceneGenerationMetadata: sceneGenerationMetadata,
    });
  }

  get_camera_person_mode(): boolean {
    return this.camera_person_mode;
  }

  switchCameraView() {
    this.utils.switchCameraView();
  }

  async showLoading() {
    loadingBarIsShowing.value = true;
  }

  async updateLoad({
    progress,
    message,
    label,
  }: {
    progress?: number;
    message?: string;
    label?: string;
  }) {
    loadingBarData.value = {
      label: label ?? loadingBarData.value.label,
      progress: progress ?? loadingBarData.value.progress,
      message: message ?? loadingBarData.value.message,
    };
  }

  async endLoading() {
    loadingBarIsShowing.value = false;
  }

  deleteObject(uuid: string) {
    this.mouse_controls?.clearFKVisuals();
    this.mouse_controls?.removeTransformControls(true);
    this.utils.deleteObject(uuid);
    if (this.outliner_feature_flag) {
      const result = this.sceneManager?.render_outliner(
        this.getCharactersByUuid(),
      );
      if (result) usePageSceneStore.getState().setOutlinerItems(result.items);
    }
  }

  async create_parim(name: string, pos: THREE.Vector3) {
    return await this.activeScene.instantiate(name, pos);
  }

  // Render the scene to the camera, this is called in the update.
  async renderScene() {
    if (
      this.postProcessing.composer != null &&
      !this.rendering &&
      this.rawRenderer &&
      this.postProcessing.render_composer
    ) {
      this.postProcessing.composer.render();
    } else if (this.renderer && this.render_camera && !this.rendering) {
      this.renderer.setSize(this.render_width, this.render_height);
      this.renderer.render(this.activeScene.scene, this.render_camera);
    } else if (this.rendering && this.renderer) {
      this.renderer.setSize(this.render_width, this.render_height);
    }
  }

  async renderSingleFrame() {
    //console.timeEnd("Single Frame Time");
    //console.time("Single Frame Time");
    this.viewport.containerMayReset();

    if (!this.rendering && this.viewport.container) {
      if (
        this.viewport.container.clientWidth + this.viewport.container.clientHeight !==
        this.viewport.lastCanvasSize
      ) {
        this.viewport.onWindowResize();
        this.viewport.lastCanvasSize =
          this.viewport.container.clientWidth + this.viewport.container.clientHeight;
      }
    }

    if (this.clock == undefined || this.renderer == undefined) {
      return;
    }

    const delta_time = this.clock.getDelta();

    // Update camera properties from the store before FreeCam update
    const store = usePageSceneStore.getState();
    if (store.selectedCameraId && this.camera) {
      const camData = store.cameras.find((c) => c.id === store.selectedCameraId);
      if (camData) {
        const fov = this.focalLengthToFov(camData.focalLength);
        if (this.camera.fov !== fov) {
          this.camera.fov = fov;
          this.camera.updateProjectionMatrix();
        }
      }
    }

    if (this.freeCamState && this.camera) {
      const moved = freeCamFrameTick(this.camera, this.freeCamState, 5 * delta_time);
      // Mirror the active camera's transform back into the store so
      // PromptBox3D and the camera-list UI stay in sync.
      if (moved && store.selectedCameraId) {
        const lookAt = lookAtFromCamera(this.camera);
        const pos = this.camera.position;
        const rot = this.camera.rotation;
        store.updateCamera(store.selectedCameraId, {
          position: { x: pos.x, y: pos.y, z: pos.z },
          rotation: { x: rot.x, y: rot.y, z: rot.z },
          lookAt: { x: lookAt.x, y: lookAt.y, z: lookAt.z },
        });
      }
    }
    this.activeScene.shader_objects.forEach((shader) => {
      shader.material.uniforms["time"].value += 0.5 * delta_time;
    });

    if (this.camera_person_mode) {
      if (this.cam_obj && this.camera) {
        // Without a timeline scrubber, edits in camera-person mode write
        // back into cam_obj rather than copying out of it.
        this.cam_obj.position.copy(this.camera.position);
        this.cam_obj.rotation.copy(this.camera.rotation);

        this.cam_obj.visible = false;

        // const min = new THREE.Vector3(-12, -1, -12);
        // const max = new THREE.Vector3(12, 24, 12);
        // this.camera.position.copy(this.camera.position.clamp(min, max));
      }
    } else if (this.cam_obj) {
      this.cam_obj.visible = true;
    }

    if (this.render_camera && this.cam_obj) {
      this.render_camera.position.copy(this.cam_obj.position);
      this.render_camera.rotation.copy(this.cam_obj.rotation);
      this.cam_obj.scale.copy(new THREE.Vector3(1, 1, 1));
    }

    if (this.utils.getSelectedSum() !== this.last_selected_sum) {
      this.updateSelectedUI();
    }
    this.last_selected_sum = this.utils.getSelectedSum();

    await this.renderScene();

    this.stats.update();
  }

  // Basicly Unity 3D's update loop.
  updateLoop() {
    if (!this.shouldRender) {
      console.debug("Stopping 3D render loop");
      return;
    }

    // Performance improvement: Handle frame cap
    // Request the next render already - this is necessary so the loop doesn't stop if the fps cap is hit
    this.renderEventToken = requestAnimationFrame(this.updateLoop.bind(this));
    const frameTime = performance.now();
    if (frameTime - this.lastFrameTime < 1000 / this.cap_fps) {
      return;
    }

    this.lastFrameTime = frameTime;
    this.renderSingleFrame();
  }

  startRenderLoop() {
    if (this.shouldRender) {
      console.warn("Render flag is already true");
      return;
    }

    this.shouldRender = true;
    this.updateLoop();
  }

  stopRenderLoop() {
    this.shouldRender = false;

    if (this.renderEventToken) {
      cancelAnimationFrame(this.renderEventToken);
      this.renderEventToken = -1;
    }
  }

  remountEngine() {
    const store = usePageSceneStore.getState();
    if (!store.is3DEditorInitialized) {
      console.log("3D mount: Wait for initialization");
      return;
    }

    if (this.isMounted) {
      console.log("3D already mounted, skipping");
      return;
    }

    if (!store.is3DPageMounted) {
      console.log("3D mount: Wait for DOM mount");
      return;
    }

    this.isMounted = true;
    this.startRenderLoop();
    this.sceneManager?.attachEventListeners();
    console.log("3D Editor Engine remounted");
  }

  unmountEngine() {
    setIs3DSceneLoaded(false);
    this.stopRenderLoop();
    this.sceneManager?.detachEventListeners();

    // Fix: dispose 3D contexts
    this.renderer?.dispose();
    this.postProcessing.dispose();
    this.rawRenderer?.dispose();

    this.isMounted = false;
    setIs3DEditorInitialized(false);
    console.log("3D Editor Engine unmounted");
  }

  // Facade for actions/setTransformMode + keymap dispatch. Reads the
  // store's current transform space and forwards to the gizmo.
  change_mode(type: "translate" | "rotate" | "scale") {
    const space =
      type === "scale" ? "local" : usePageSceneStore.getState().transformSpace;
    this.gizmo.changeMode(type, space);
  }

  // Facade for Controls3D button + keymap. Toggles the store's
  // transform space and pushes the new value into the gizmo.
  toggleTransformSpace() {
    if (!this.gizmo.canToggleSpace()) return;
    const store = usePageSceneStore.getState();
    const next = store.transformSpace === "world" ? "local" : "world";
    store.setTransformSpace(next);
    this.gizmo.setSpace(next);
  }

  togglePlayback() {
    this.updateLoad({
      progress: 25,
      label: "Starting Processing",
      message:
        "Please stay on this screen and do not switch tabs! while your video is being processed.",
    });
    if (this.rawRenderer) {
      this.startRenderWidth = this.rawRenderer.domElement.width;
      this.startRenderHeight = this.rawRenderer.domElement.height;
    }
    if (!this.rendering) {
      this.switchCameraView();
      if (this.activeScene.hot_items) {
        this.activeScene.hot_items.forEach((element) => {
          element.visible = true;
        });
      }
    } else {
      if (!this.camera_person_mode) {
        this.switchCameraView();
      }
      if (this.activeScene.hot_items) {
        this.activeScene.hot_items.forEach((element) => {
          element.visible = false;
        });
      }
    }
  }

  updateOutliner() {
    const result = this.sceneManager?.render_outliner(
      this.getCharactersByUuid(),
    );
    if (result) usePageSceneStore.getState().setOutlinerItems(result.items);
    this.updateSelectedUI();
  }

  updateSelectedUI() {
    let mainSelected;
    if (this.outliner_feature_flag) {
      if (this.sceneManager?.selected_objects === undefined) {
        return;
      }
      if (this.sceneManager?.selected_objects.length <= 0) {
        return 0;
      }

      mainSelected = this.sceneManager?.selected_objects[0];
    } else {
      if (this.selected == undefined) {
        return 0;
      }
      mainSelected = this.selected;
    }

    this.selected = mainSelected;
    const pos = mainSelected.position;
    const rot = mainSelected.rotation;
    const scale = mainSelected.scale;

    // TODO this is a bug we need to only show when clicked on and use UPDATE when updating.
    usePageSceneStore.getState().updateObjectPanel({
      group:
        mainSelected.name === this.camera_name
          ? ClipGroup.CAMERA
          : ClipGroup.OBJECT, // TODO: add meta data to determine what it is a camera or a object or a character into prefab clips
      object_uuid: mainSelected.uuid,
      object_name: mainSelected.name,
      version: String(this.version),
      objectVectors: {
        position: {
          x: parseFloat(pos.x.toFixed(2)),
          y: parseFloat(pos.y.toFixed(2)),
          z: parseFloat(pos.z.toFixed(2)),
        },
        rotation: {
          x: parseFloat(THREE.MathUtils.radToDeg(rot.x).toFixed(2)),
          y: parseFloat(THREE.MathUtils.radToDeg(rot.y).toFixed(2)),
          z: parseFloat(THREE.MathUtils.radToDeg(rot.z).toFixed(2)),
        },
        scale: {
          x: parseFloat(scale.x.toFixed(6)),
          y: parseFloat(scale.y.toFixed(6)),
          z: parseFloat(scale.z.toFixed(6)),
        },
      },
    }); //end updateObjectPanel
  }

  getAssetType(selected: THREE.Object3D<THREE.Object3DEventMap>): AssetType {
    if (selected.type === "Mesh") {
      return selected.name === "::CAM::" ? AssetType.CAMERA : AssetType.OBJECT;
    }
    return AssetType.CHARACTER;
  }

  publishSelect() {
    const store = usePageSceneStore.getState();
    const target = this.outliner_feature_flag
      ? this.sceneManager?.selected_objects?.[0]
      : this.selected;
    if (target) {
      store.setSelectedObject({
        type: this.getAssetType(target),
        id: target.uuid,
      });
    } else {
      store.setSelectedObject(null);
    }
  }

  // Replaces the deleted Timeline.isCharacter — checks the Zustand store's
  // character list, which is the source of truth for which scene objects
  // are characters.
  isCharacterUuid(uuid: string): boolean {
    return usePageSceneStore
      .getState()
      .characters.some((c) => c.id === uuid);
  }

  // Replaces Timeline.characters (a Record<uuid, ClipGroup>) — used by
  // SceneManager.render_outliner to know which scene objects to render as
  // characters.
  getCharactersByUuid(): { [uuid: string]: ClipGroup } {
    const characters = usePageSceneStore.getState().characters;
    const result: { [uuid: string]: ClipGroup } = {};
    for (const c of characters) {
      result[c.id] = ClipGroup.CHARACTER;
    }
    return result;
  }
}

export default Editor;
