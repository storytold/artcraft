import * as THREE from "three";
import { signal } from "@preact/signals-react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FreeCam } from "./free_cam";
import { TransformControls } from "./TransformControls.js";
import Scene from "./scene.js";
import { APIManager, ArtStyle } from "./api_manager.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { SAOPass } from "three/addons/postprocessing/SAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import AudioEngine from "./Engines/audio_engine.js";
import TransformEngine from "./Engines/transform_engine.js";
import EmotionEngine from "./Engines/emotion_engine";
import { TimeLine } from "./timeline.js";
import LipSyncEngine from "./Engines/lip_sync_engine.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { EditorStates, CameraAspectRatio } from "~/pages/PageEnigma/enums";
import { AssetType, ClipGroup } from "~/enums";
import { XYZ } from "../datastructures/common";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { fromEngineActions } from "~/pages/PageEnigma/Queue/fromEngineActions";
import { MediaItem } from "~/pages/PageEnigma/models";
import {
  editorState,
  cameraAspectRatio,
  gridVisibility,
} from "../signals/engine";
import { SceneUtils } from "./helper";
import { VideoGeneration } from "./video_generation";
import { MouseControls } from "./keybinds_controls";
import { SaveManager } from "./save_manager";
import {
  authentication,
  loadingBarData,
  loadingBarIsShowing,
  signalScene,
} from "~/signals";

import { outlinerState, updateObjectPanel } from "../signals";
import { transformSpace } from "../signals/selectedMode";
import { IGenerationOptions } from "../models/generationOptions";
import { toEngineActions } from "../Queue/toEngineActions";
import { SceneGenereationMetaData } from "../models/sceneGenerationMetadata";
import { MediaUploadApi } from "~/Classes/ApiManager";
import { SceneManager } from "./scene_manager_api";
import { CustomOutlinePass } from "./CustomOutlinePass.js";
import FindSurfaces from "./FindSurfaces.js";

import Stats from "three/examples/jsm/libs/stats.module.js";
import { CharacterAnimationEngine } from "./Engines/CharacterAnimationEngine";
import { cameras, selectedCameraId } from "~/pages/PageEnigma/signals/camera";
import { SparkRenderer } from "@sparkjsdev/spark";
import { SSAOPass } from "three/examples/jsm/Addons.js";

export type EditorInitializeConfig = {
  sceneToken: string;
  editorCanvasEl: HTMLCanvasElement;
  camViewCanvasEl: HTMLCanvasElement;
  sceneContainerEl: HTMLDivElement;
  cacheJsonString?: string;
};

// ONLY USED IN THIS CLASS
// Need this one to ensure the canvas is inflated and non-zero sized
const is3DPageMounted = signal(false);
export const set3DPageMounted = (isMounted: boolean) => {
  is3DPageMounted.value = isMounted;
};

// Need this one to know when the engine has initialized (but not necessarily loaded saves)
export const is3DEditorInitialized = signal(false);
export const setIs3DEditorInitialized = (isInitialized: boolean) => {
  is3DEditorInitialized.value = isInitialized;
};

// Need this one to know when the engine is done loading stuff into the scene for display
export const is3DSceneLoaded = signal(false);
export const setIs3DSceneLoaded = (isLoaded: boolean) => {
  is3DSceneLoaded.value = isLoaded;
};

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
  canvReference: HTMLCanvasElement | null = null;
  canvasRenderCamReference: HTMLCanvasElement | null = null;

  composer: EffectComposer | undefined;
  render_composer: EffectComposer | undefined;
  outlinePass: OutlinePass | undefined;
  last_cam_pos: THREE.Vector3;
  last_cam_rot: THREE.Euler;
  ssaoPass: SSAOPass | undefined;
  outputPass: OutputPass | undefined;
  renderOutputPass: OutputPass | undefined;
  bloomPass: UnrealBloomPass | undefined;
  smaaPass: SMAAPass | undefined;
  control: TransformControls | undefined;
  raycaster: THREE.Raycaster | undefined;
  mouse: THREE.Vector2 | undefined;
  selected: THREE.Object3D | undefined;
  last_selected: THREE.Object3D | undefined;
  last_selected_sum: number | undefined;
  transform_interaction = false;
  rendering: boolean;
  api_manager: APIManager;
  cameraViewControls: FreeCam | undefined;
  orbitControls: OrbitControls | undefined;
  locked: boolean;

  render_timer: number;
  fps_number: number;
  cap_fps: number;
  can_playback: boolean;
  playback_location: number;
  audio_engine: AudioEngine;
  transform_engine: TransformEngine;
  emotion_engine: EmotionEngine;
  lipsync_engine: LipSyncEngine;
  animation_engine: CharacterAnimationEngine;
  timeline: TimeLine;
  current_frame: number;
  lockControls: PointerLockControls | undefined;
  cam_obj: THREE.Object3D | undefined;
  camera_last_pos: THREE.Vector3;
  renderPass: RenderPass | undefined;
  generating_preview: boolean;
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
  containerResizeObserver: ResizeObserver | undefined;

  positive_prompt: string;
  negative_prompt: string;
  art_style: ArtStyle;
  rawRenderPass: RenderPass | undefined;

  last_scrub: number;
  recorder: MediaRecorder | undefined;
  container: HTMLElement | null = null;

  selectedCanvas: boolean;
  startRenderHeight: number;
  startRenderWidth: number;
  lastCanvasSize: number;
  // Default params.

  // global names of scene entities
  camera_name: string;

  utils: SceneUtils;
  videoGeneration: VideoGeneration;
  mouse_controls: MouseControls | undefined;
  save_manager: SaveManager;

  generation_options: IGenerationOptions;

  // just a passive the image to be uploaded. we store the token and use that in snapshots.
  globalIpAdapterImage: File | undefined;

  media_upload: MediaUploadApi;

  sceneManager: SceneManager | undefined;

  ///////////////////////////////////////////////
  ///////////////////////////////////////////////

  public outliner_feature_flag: boolean;
  public engine_preprocessing: boolean = false; // this is to do preprocessing also called render fast.

  ///////////////////////////////////////////////
  ///////////////////////////////////////////////

  focused: boolean = false;

  customOutlinerPass: CustomOutlinePass | undefined;
  surfaceFinder: FindSurfaces | undefined;

  // New Rendering Pipeline Engine Work
  //videoAudioPreProcessor: VideoAudioPreProcessor | undefined;

  engineFrameBuffers: EngineFrameBuffers;
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

    this.activeScene = new Scene(
      "" + this.version,
      this.camera_name,
      this.updateSurfaceIdAttributeToMesh.bind(this),
      this.version,
    );
    this.activeScene.initialize();
    this.generating_preview = false;
    this.last_cam_pos = new THREE.Vector3(0, 0, 0);
    this.last_cam_rot = new THREE.Euler(0, 0, 0);
    this.camera_last_pos = new THREE.Vector3(0, 0, 0);
    this.startRenderWidth = 0;
    this.startRenderHeight = 0;
    this.rendering = false;
    this.lastCanvasSize = 0;
    this.switchPreviewToggle = false;
    // API.
    this.api_manager = new APIManager();
    // Debug & Movement.
    this.camera_person_mode = false;
    this.locked = false;
    // Recording params.
    this.render_timer = 0;
    this.fps_number = 60;
    this.cap_fps = 60;
    // Timeline settings.
    this.can_playback = false;
    this.playback_location = 0;
    this.last_scrub = 0;
    this.frames = 0;
    this.lastFrameTime = 0;
    this.last_selected_sum = 0;
    this.selectedCanvas = false;
    this.renderEventToken = -1;
    this.shouldRender = false;
    // Audio Engine Test.

    this.render_camera_aspect_ratio = CameraAspectRatio.HORIZONTAL_3_2;
    this.render_width = this.getRenderDimensions().width;
    this.render_height = this.getRenderDimensions().height;

    this.audio_engine = new AudioEngine();
    this.emotion_engine = new EmotionEngine(this.version);
    this.transform_engine = new TransformEngine(this.version);
    this.lipsync_engine = new LipSyncEngine();
    this.animation_engine = new CharacterAnimationEngine(this.version);

    this.timeline = new TimeLine(
      this,
      this.audio_engine,
      this.transform_engine,
      this.lipsync_engine,
      this.animation_engine,
      this.emotion_engine,
      this.activeScene,
      this.camera,
      this.mouse,
      this.camera_name,
    );

    this.activeScene.timeline = this.timeline;

    this.utils = new SceneUtils(this, this.activeScene);
    this.videoGeneration = new VideoGeneration(this);
    this.save_manager = new SaveManager(this);
    this.current_frame = 0;

    // Scene State
    this.current_scene_media_token = null;
    this.current_scene_glb_media_token = null;

    // stylization parameters
    this.positive_prompt =
      "((masterpiece, best quality, 8K, detailed)), colorful, epic, fantasy, (fox, red fox:1.2), no humans, 1other, ((koi pond)), outdoors, pond, rocks, stones, koi fish, ((watercolor))), lilypad, fish swimming around.";
    this.negative_prompt = "";
    this.art_style = ArtStyle.Anime2DFlat;

    this.generation_options = {
      faceDetail: false,
      upscale: false,
      styleStrength: 1.0,
      lipSync: false,
      cinematic: false,
      globalIpAdapterImageMediaToken: null,
    };

    this.media_upload = new MediaUploadApi();
    this.globalIpAdapterImage = undefined; // used to display when loading in the app. and to serialize to an image token
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

  containerMayReset() {
    //TODO: we should not need this, if the container is reset,
    // updateSceneContainer should update the reference in the editor
    if (!this.container) {
      console.warn(
        "Editor - Container does not exist, querying from DOM via document.getElementById",
      );
      this.container = document.getElementById("video-scene-container");
    }
  }
  updateSceneContainer(newContainer: HTMLDivElement) {
    this.container = newContainer;
    this.containerResizeObserver?.disconnect();
    this.containerResizeObserver?.observe(this.container);
  }
  engineCanvasMayReset() {
    //TODO: we should not need this, if the this canvas is reset,
    // updateEngineCanvas should update the reference in the editor
    if (!this.canvReference) {
      console.warn(
        "Editor - Engine Canbas does not exist, querying from DOM via document.getElementById",
      );
      this.canvReference = document.getElementById(
        "video-scene",
      ) as HTMLCanvasElement;
    }
  }
  updateEngineCanvas(newCanvas: HTMLCanvasElement) {
    this.canvReference = newCanvas;
    if (this.renderer) {
      this.renderer.domElement = this.canvReference;
    }
  }
  camViewCanvasMayReset() {
    //TODO: we should not need this, if the this canvas is reset,
    // updateCamViewCanvas should update the reference in the editor
    if (!this.canvasRenderCamReference) {
      console.warn(
        "Editor - Cam View Canvas does not exist, querying from DOM via document.getElementById",
      );
      this.canvasRenderCamReference = document.getElementById(
        "camera-view",
      ) as HTMLCanvasElement;
    }
  }
  updateCamViewCanvas(newCanvas: HTMLCanvasElement) {
    this.canvasRenderCamReference = newCanvas;
    if (this.rawRenderer) {
      this.rawRenderer.domElement = this.canvasRenderCamReference;
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

    Queue.publish({
      queueName: QueueNames.FROM_ENGINE,
      action: fromEngineActions.CAMERA_ASPECT_RATIO_CHANGED,
      data: this.render_camera_aspect_ratio,
    });
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
    this.canvReference = editorCanvasEl;
    this.canvasRenderCamReference = camViewCanvasEl;

    // Find the container element
    this.container = sceneContainerEl;

    // Use the container's dimensions
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    // Sets up camera and base position using camera configurations from camera.ts
    const mainCameraConfig = cameras.value.find((cam) => cam.id === "main");
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

    this.timeline.camera = this.camera;

    const otherCameras = cameras.value.filter((cam) => cam.id !== "main");
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
      canvas: this.canvReference,
      preserveDrawingBuffer: true,
    });

    // this.sparkRenderer = new SparkRenderer({
    //   renderer: this.renderer,
    //   autoUpdate: true,
    // });

    this.rawRenderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.canvasRenderCamReference,
      preserveDrawingBuffer: true,
    });

    this.renderer.shadowMap.enabled = true;
    this.clock = new THREE.Clock();

    // Resizes the renderer.
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this._configurePostProcessing();
    // Controls and movement.

    this.lockControls = new PointerLockControls(
      this.camera,
      this.renderer.domElement,
    );
    this.cameraViewControls = new FreeCam(
      this.camera,
      this.renderer.domElement,
    );
    this.cameraViewControls.movementSpeed = 1.15;
    this.cameraViewControls.domElement = this.renderer.domElement;
    this.cameraViewControls.rollSpeed = Math.PI / 180;
    this.cameraViewControls.autoForward = false;
    this.cameraViewControls.dragToLook = true;
    this.cameraViewControls.enabled = true;

    this.control = new TransformControls(this.camera, this.renderer.domElement);
    this.control.space = "world"; // Default to world space for translate mode
    this.control.setScaleSnap(0.01);
    this.control.setTranslationSnap(0.01);
    this.control.setRotationSnap(0.01);
    //console.log("Control Sensitivity:", this.control.sensitivity);

    // Base control and debug stuff remove debug in prod.
    if (this.control == undefined) {
      return;
    }
    this.control.addEventListener("change", this.renderScene.bind(this));
    this.control.addEventListener("dragging-changed", (event: any) => {
      //TODO: any should be the following
      this.updateSelectedUI();
      this.camera_last_pos.copy(new THREE.Vector3(-99999, -99999, -99999));
      this.focused = !event.value;
      // this.update_properties()
    });
    this.control.setSize(0.5); // Good default value for visuals.
    this.raycaster = new THREE.Raycaster();
    // Configure raycaster to check both layers
    this.raycaster.layers.set(0); // Enable default layer
    this.raycaster.layers.enable(1); // Also check objects on the custom layer

    this.mouse = new THREE.Vector2();
    this.activeScene.scene.add(this.control);
    // Resets canvas size.
    this.onWindowResize();

    this.setupResizeObserver();

    this.timeline.scene = this.activeScene;

    // saving state of the scene
    this.current_scene_media_token = null;
    this.current_scene_glb_media_token = null;

    this.cam_obj = this.activeScene.get_object_by_name(this.camera_name);

    this.mouse_controls = new MouseControls(
      this.camera,
      this.get_camera_person_mode.bind(this),
      this.cameraViewControls,
      this.lockControls,
      this.camera_last_pos,
      this.selectedCanvas,
      this.switchPreviewToggle,
      this.rendering,
      this.togglePlayback.bind(this),
      this.deleteObject.bind(this),
      this.canvReference,
      this.mouse,
      this.timeline.mouse,
      this.raycaster,
      this.control,
      this.outlinePass,
      this.activeScene.scene,
      this.publishSelect.bind(this),
      this.updateSelectedUI.bind(this),
      this.transform_interaction,
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
        this.timeline.isCharacter.bind(this.timeline),
      ); // Enabled dev mode.
      this.mouse_controls.sceneManager = this.sceneManager;
    }

    // Attach freecam state controller
    this.mouseOverEventHandler = this.mouseOverEventHandler.bind(this);

    // Add spark renderer as a child of the camera
    // this.activeScene.scene.add(this.sparkRenderer);
    // this.camera?.add(this.sparkRenderer);

    const onloadCallback = () => {
      console.log("Setting Scene is loaded");
      this._isEngineDataLoaded = true;

      if (this.outliner_feature_flag) {
        const result = this.sceneManager?.render_outliner(
          this.timeline.characters,
        );
        if (result) outlinerState.items.value = result.items;
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

    this._configurePostProcessingRaw();

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

  private mouseOverEventHandler(event: MouseEvent) {
    if (this.cameraViewControls) {
      if (
        event.target instanceof HTMLCanvasElement ||
        (event.target as HTMLElement).id == "letterbox"
      ) {
        this.cameraViewControls.enabled = true;
        this.selectedCanvas = true;
        this.focused = true;
      } else {
        this.cameraViewControls.reset();
        this.focused = false;
        this.cameraViewControls.enabled = false;
        this.selectedCanvas = false;
      }
    }
  }

  public enableFreeCamControls() {
    document.addEventListener("mouseover", this.mouseOverEventHandler);
  }

  public disableFreeCamControls() {
    document.removeEventListener("mouseover", this.mouseOverEventHandler);
  }

  // Captures the scene without the grid
  public snapShotOfCurrentFrame(shouldDownload: boolean = true) {
    if (!this.renderer?.domElement || !this.camera) {
      console.error("Error: Renderer or camera not available.");
      return null;
    }

    const currentAspectRatio = cameraAspectRatio.value;

    // Store grid visibility state and hide grid
    const wasGridVisible = gridVisibility.value;
    gridVisibility.value = false;

    // Store and hide transform controls
    const wasControlVisible = this.control?.visible ?? false;
    if (this.control) {
      this.control.visible = false;
    }

    // Store and disable outline pass
    const wasOutlineEnabled = this.outlinePass?.enabled ?? false;
    if (this.outlinePass) {
      this.outlinePass.enabled = false;
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
    if (this.composer) {
      this.composer.setSize(targetWidth, targetHeight);
      this.composer.render();
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
    if (this.composer) {
      this.composer.setSize(originalWidth, originalHeight);
      this.composer.render();
    } else {
      this.renderer.render(this.activeScene.scene, this.camera);
    }

    // Restore grid visibility
    gridVisibility.value = wasGridVisible;

    // Restore transform controls visibility
    if (this.control) {
      this.control.visible = wasControlVisible;
    }

    // Restore outline pass
    if (this.outlinePass) {
      this.outlinePass.enabled = wasOutlineEnabled;
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
    this.audio_engine = new AudioEngine();
    this.emotion_engine = new EmotionEngine(this.version);
    this.transform_engine = new TransformEngine(this.version);
    this.lipsync_engine = new LipSyncEngine();
    this.animation_engine = new CharacterAnimationEngine(this.version);

    this.timeline = new TimeLine(
      this,
      this.audio_engine,
      this.transform_engine,
      this.lipsync_engine,
      this.animation_engine,
      this.emotion_engine,
      this.activeScene,
      this.camera,
      this.mouse,
      this.camera_name,
    );
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
    Queue.publish({
      queueName: QueueNames.FROM_ENGINE,
      action: fromEngineActions.RESET_TIMELINE,
      data: null,
    });

    if (this.outliner_feature_flag) {
      const result = this.sceneManager?.render_outliner(
        this.timeline.characters,
      );
      if (result) outlinerState.items.value = result.items;
    }
  }

  public async loadCache(cacheJson: string) {
    await this.save_manager.loadCache(cacheJson);
  }

  public async loadScene(scene_media_token: string) {
    await this.save_manager.loadScene(scene_media_token);

    if (this.outliner_feature_flag) {
      const result = this.sceneManager?.render_outliner(
        this.timeline.characters,
      );
      if (result) outlinerState.items.value = result.items;
    }
    // publish to the UI the values for the prompts and artistic style and settings?
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.UPDATE_TIME,
      data: { currentTime: 1 },
    });
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

  _configurePostProcessingRaw() {
    const width = this.canvasRenderCamReference?.width ?? 0;
    const height = this.canvasRenderCamReference?.height ?? 0;
    if (
      this.rawRenderer == undefined ||
      this.render_camera == undefined ||
      this.renderer == undefined
    ) {
      return;
    }

    const depthTexture = new THREE.DepthTexture(width, height);
    depthTexture.type = THREE.UnsignedShortType;

    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        depthTexture: depthTexture,
        depthBuffer: true,
      },
    );

    this.customOutlinerPass = new CustomOutlinePass(
      new THREE.Vector2(width, height),
      this.activeScene.scene,
      this.render_camera,
    );

    this.render_composer = new EffectComposer(this.rawRenderer, renderTarget);

    this.surfaceFinder = new FindSurfaces();

    this.rawRenderPass = new RenderPass(
      this.activeScene.scene,
      this.render_camera,
    );

    this.render_composer.addPass(this.rawRenderPass);

    this.render_composer.addPass(this.customOutlinerPass);

    this.renderOutputPass = new OutputPass();

    this.render_composer.addPass(this.renderOutputPass);

    this.setColorMap();
  }

  setRenderDepth() {
    this.updateSurfaceIdAttributeToMesh(this.activeScene.scene);
    if (this.render_camera && this.customOutlinerPass) {
      this.customOutlinerPass.fsQuad.material.uniforms.debugVisualize.value = 3; // Depth
    }
  }

  setNormalMap() {
    this.updateSurfaceIdAttributeToMesh(this.activeScene.scene);
    if (this.render_camera && this.customOutlinerPass) {
      this.customOutlinerPass.fsQuad.material.uniforms.debugVisualize.value = 4; // Normal Map
    }
  }

  setColorMap() {
    this.updateSurfaceIdAttributeToMesh(this.activeScene.scene);
    if (this.render_camera && this.customOutlinerPass) {
      this.customOutlinerPass.fsQuad.material.uniforms.debugVisualize.value = 2; // Renderd Color
    }
  }

  setOutlineRender() {
    this.updateSurfaceIdAttributeToMesh(this.activeScene.scene);
    if (this.render_camera && this.customOutlinerPass) {
      this.customOutlinerPass.fsQuad.material.uniforms.debugVisualize.value = 7; // Outlines Only
    }
  }

  // Configure post processing.
  _configurePostProcessing() {
    const width = this.canvReference?.width ?? 0;
    const height = this.canvReference?.height ?? 0;

    if (this.renderer == undefined || this.camera == undefined) {
      return;
    }

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.activeScene.scene, this.camera);

    this.composer.addPass(this.renderPass);

    this.outlinePass = new OutlinePass(
      new THREE.Vector2(width / 10, height / 10),
      this.activeScene.scene,
      this.camera,
    );

    // this.outlinePass.edgeStrength = 5.0;
    // this.outlinePass.edgeGlow = 0.1;
    // this.outlinePass.edgeThickness = 1.2;
    // this.outlinePass.pulsePeriod = 3;
    // this.outlinePass.usePatternTexture = false;
    // this.outlinePass.visibleEdgeColor.set(0x4b9fff);

    // this.composer.addPass(this.outlinePass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.5,
      0.4,
      0.85,
    );
    this.bloomPass.strength = 0.25;

    // this.smaaPass = new SMAAPass(
    //   width * this.renderer.getPixelRatio(),
    //   height * this.renderer.getPixelRatio(),
    // );

    // this.composer.addPass(this.bloomPass);
    // this.composer.addPass(this.smaaPass);

    // this.ssaoPass = new SSAOPass(this.activeScene.scene, this.camera, width, height);
    // this.composer.addPass(this.ssaoPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  deleteObject(uuid: string) {
    this.mouse_controls?.clearFKVisuals();
    this.mouse_controls?.removeTransformControls(true);
    this.utils.deleteObject(uuid);
    if (this.outliner_feature_flag) {
      const result = this.sceneManager?.render_outliner(
        this.timeline.characters,
      );
      if (result) outlinerState.items.value = result.items;
    }
  }

  async create_parim(name: string, pos: THREE.Vector3) {
    return await this.activeScene.instantiate(name, pos);
  }

  updateSurfaceIdAttributeToMesh(scene: THREE.Scene) {
    if (this.surfaceFinder === undefined) {
      return;
    }
    this.surfaceFinder.surfaceId = 0;
    this.customOutlinerPass?.updateMaxSurfaceId(
      this.surfaceFinder.surfaceId + 1,
    );
  }

  async recordScene() {
    // Preconditions required to record the scene when generating the movie.
    if (this.rendering && this.rawRenderer && this.clock && this.renderer) {
      if (this.recorder === undefined && this.render_camera) {
        const width =
          this.render_camera_aspect_ratio === CameraAspectRatio.HORIZONTAL_16_9
            ? 1024
            : this.render_camera_aspect_ratio === meraAspectRatio.VERTICAL_9_16
              ? 576
              : this.render_camera_aspect_ratio ===
                meraAspectRatio.HORIZONTAL_3_2
                ? 900
                : this.render_camera_aspect_ratio ===
                  meraAspectRatio.VERTICAL_2_3
                  ? 600
                  : 1000;
        const height =
          this.render_camera_aspect_ratio === CameraAspectRatio.HORIZONTAL_16_9
            ? 576
            : this.render_camera_aspect_ratio === meraAspectRatio.VERTICAL_9_16
              ? 1024
              : this.render_camera_aspect_ratio ===
                meraAspectRatio.HORIZONTAL_3_2
                ? 600
                : this.render_camera_aspect_ratio ===
                  meraAspectRatio.VERTICAL_2_3
                  ? 900
                  : 1000;

        this.rawRenderer.setSize(width, height);

        // ensure that during a resize or change in perspective this will processes correct.
        this.engineFrameBuffers.setRenderSurfaceSize(width, height);

        this.render_camera.aspect = width / height;
      }

      this.render_timer += this.clock.getDelta();

      this.playback_location++;

      this.utils.removeTransformControls(true);

      if (this.timeline.is_playing) {
        this.setColorMap();
        this.render_composer?.render();
        if (this.canvReference) {
          console.time("Color Frame RenderTime");

          // reset this flag to ensure that a failure isn't cached
          this.processingHasFailed = false;
          // can't render without this.

          if (!this.render_camera) {
            return;
          }

          this.engineFrameBuffers.enqueueWork(
            this.rawRenderer,
            this.activeScene.scene,
            this.render_camera,
          );

          this.renderIndex += 1;
          console.log(`Frames Counted: ${this.renderIndex}`);

          console.timeEnd("Color Frame RenderTime");
        } else {
          console.log("We lost the canvas reference.");
        }

        this.render_timer += this.clock.getDelta();
      }
      if (!this.timeline.is_playing) {
        this.playback_location = 0;
        try {
          if (this.processingRecording) {
            console.log(
              "processingRecording is already happening this shouldn't have happened",
            );
            return;
          }
          this.processingRecording = true;
          // collect all frames here, there is some kind of race condition that is happening
          // TODO BUG with the main loop,that sends multiple zip requests.
          console.log(`COLLECTING COLOR FRAMES COUNTED: ${this.renderIndex}`);
          await this.engineFrameBuffers.collectColorFrames(this.renderIndex);

          this.renderIndex = 0;
          console.time("Stop Playback And Upload Video Time");
          await this.stopPlaybackAndUploadVideo();
          console.timeEnd("Stop Playback And Upload Video Time");

          this.processingRecording = false;
          console.log("Processing has ended");
        } catch (error) {
          // don't use cache in this case.
          this.processingHasFailed = true;

          console.log(`Video Generation: ${error}`);
        }
      } // End Timeline Playing

      // BRB ^)^
    }
  }

  // Render the scene to the camera, this is called in the update.
  async renderScene() {
    if (
      this.composer != null &&
      !this.rendering &&
      this.rawRenderer &&
      this.render_composer
    ) {
      //const then = performance.now();
      this.composer.render();
      //const now = performance.now();
      //console.log("Performance: ", now - then);
      //this.rawRenderer.render(this.activeScene.scene, this.render_camera!);
      // this.render_composer.render();
    } else if (this.renderer && this.render_camera && !this.rendering) {
      this.renderer.setSize(this.render_width, this.render_height);
      this.renderer.render(this.activeScene.scene, this.render_camera);
    } else if (this.rendering && this.renderer) {
      this.renderer.setSize(this.render_width, this.render_height);
    }
    // await this.recordScene();
  }

  async useCachedMediaTokens(): Promise<boolean> {
    // if the preprecessing switch is not the same then we need to rerender
    if (
      this.videoGeneration.last_position_of_preprocessing !=
      this.engine_preprocessing
    ) {
      return false;
    }
    // this is slower to do so do this last.
    const checksum = await this.save_manager.computeSceneChecksum();
    const decision = this.videoGeneration.shouldRenderScenesAgain(checksum);
    return decision;
  }

  async renderSingleFrame() {
    //console.timeEnd("Single Frame Time");
    //console.time("Single Frame Time");
    this.containerMayReset();

    if (!this.rendering && this.container) {
      if (
        this.container.clientWidth + this.container.clientHeight !==
        this.lastCanvasSize
      ) {
        this.onWindowResize();
        this.lastCanvasSize =
          this.container.clientWidth + this.container.clientHeight;
      }
    }

    if (this.clock == undefined || this.renderer == undefined) {
      return;
    }

    const delta_time = this.clock.getDelta();

    // Update camera properties from signals before FreeCam update
    if (selectedCameraId.value && this.camera) {
      const camData = cameras.value.find(
        (c) => c.id === selectedCameraId.value,
      );
      if (camData) {
        const fov = this.focalLengthToFov(camData.focalLength);
        if (this.camera.fov !== fov) {
          this.camera.fov = fov;
          this.camera.updateProjectionMatrix();
        }
      }
    }

    this.cameraViewControls?.update(5 * delta_time);
    this.activeScene.shader_objects.forEach((shader) => {
      shader.material.uniforms["time"].value += 0.5 * delta_time;
    });

    if (this.cameraViewControls && this.camera_person_mode) {
      if (this.cam_obj && this.camera) {
        if (this.last_scrub != this.timeline.scrubber_frame_position) {
          this.camera.position.copy(this.cam_obj.position);
          this.camera.rotation.copy(this.cam_obj.rotation);
        } else if (!this.timeline.is_playing) {
          this.cam_obj.position.copy(this.camera.position);
          this.cam_obj.rotation.copy(this.camera.rotation);
        } else {
          this.camera.position.copy(this.cam_obj.position);
          this.camera.rotation.copy(this.cam_obj.rotation);
        }

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

    if (this.timeline.is_playing) {
      const changeView = await this.timeline.update(this.rendering, delta_time);
      if (changeView) {
        this.switchCameraView();
      }
    } else if (
      this.last_scrub === this.timeline.scrubber_frame_position &&
      this.utils.getSelectedSum() !== this.last_selected_sum
    ) {
      this.updateSelectedUI();
    }
    this.last_selected_sum = this.utils.getSelectedSum();

    await this.renderScene();
    this.last_scrub = this.timeline.scrubber_frame_position;

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
    if (!is3DEditorInitialized.peek()) {
      console.log("3D mount: Wait for initialization");
      return;
    }

    if (this.isMounted) {
      console.log("3D already mounted, skipping");
      return;
    }

    if (!is3DPageMounted.peek()) {
      console.log("3D mount: Wait for DOM mount");
      return;
    }

    this.isMounted = true;
    this.startRenderLoop();
    this.sceneManager?.attachEventListeners();
    this.enableFreeCamControls();
    this.cameraViewControls?.attachEventListeners();
    console.log("3D Editor Engine remounted");
  }

  unmountEngine() {
    setIs3DSceneLoaded(false);
    this.stopRenderLoop();
    this.sceneManager?.detachEventListeners();
    this.disableFreeCamControls();
    this.cameraViewControls?.detachEventListeners();

    // Fix: dispose 3D contexts
    this.renderer?.dispose();
    this.composer?.dispose();
    this.render_composer?.dispose();
    this.rawRenderer?.dispose();

    this.isMounted = false;
    setIs3DEditorInitialized(false);
    console.log("3D Editor Engine unmounted");
  }

  change_mode(type: "translate" | "rotate" | "scale") {
    if (this.control == undefined) {
      return;
    }
    this.control.mode = type;
    this.control.space = type === "scale" ? "local" : transformSpace.value;
    this.transform_interaction = true;
  }

  toggleTransformSpace() {
    if (this.control == undefined || this.control.mode === "scale") {
      return;
    }
    transformSpace.value = transformSpace.value === "world" ? "local" : "world";
    this.control.space = transformSpace.value;
  }

  async stopPlaybackAndUploadVideo() {
    await this.videoGeneration.stopPlaybackAndUploadVideo();
  }

  async switchPreview() {
    if (!this.switchPreviewToggle) {
      this.switchPreviewToggle = true;
      editorState.value = EditorStates.PREVIEW;
      await this.generateFrame();
    }
  }

  switchEdit() {
    if (
      this.switchPreviewToggle &&
      this.canvasRenderCamReference &&
      this.rawRenderPass
    ) {
      this.switchPreviewToggle = false;
      editorState.value = EditorStates.EDIT;
      setTimeout(() => {
        // if (!this.canvasRenderCamReference) {
        //   this.canvasRenderCamReference =
        //     document.getElementById("camera-view");
        // }
        this.camViewCanvasMayReset();
        // this.rawRenderer = new THREE.WebGLRenderer({
        //   antialias: true,
        //   canvas: this.canvasRenderCamReference || undefined,
        //   preserveDrawingBuffer: true,
        // });
        // this._configurePostProcessingRaw();

        if (this.camera_person_mode) {
          this.switchCameraView();
        }
        this.activeScene.renderMode(false);
      }, 10);
    }
  }

  async generateFrame() {
    this.videoGeneration.generateFrame();
  }

  // This initializes the generation of a video render scene is where the core work happens
  async generateVideo() {
    // cannot run this function reliably without ensuring state below doesn't blow everything up.
    if (await this.checkAndUseCache()) {
      console.log("Generating Video: Checking Cache");
      await this.videoGeneration.handleCachedEnqueue();
      return;
    }

    // some state changes below

    this.timeline.is_playing = false;
    this.timeline.scrubber_frame_position = 0;
    this.timeline.current_time = 0;

    if (this.rendering || this.generating_preview) {
      return;
    }

    this.showLoading();

    // This for debouncing and also trigging the toggle playback...
    // has to be here or will break play back ...
    this.rendering = true;

    console.log("Running without Cache");

    this.togglePlayback();
    this.render_timer = 0;
    this.activeScene.renderMode(this.rendering);
    this.timeline.scrubber_frame_position = 0;
    if (this.activeScene.hot_items) {
      this.activeScene.hot_items.forEach((element) => {
        element.visible = false;
      });
    }
  }

  // In first case where if it cached data this is for people to reprompt without leaving the app
  // Skip performing any of this because we have not changed the scene, then exit the scene.
  // This avoids any unknown state issues from the resulting code below and escapes all the random state changes.
  // This sadly doesn't cover camera framing style changes,
  // Reasoning is that there is no defined interface to get changes like that.
  async checkAndUseCache(): Promise<boolean> {
    if (
      (await this.useCachedMediaTokens()) &&
      this.processingHasFailed == false
    ) {
      console.log("Using Cache");
      return true;
    } else {
      console.log("Not Using Cache");
      return false;
    }
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
    if (!this.rendering && this.timeline.is_playing) {
      this.timeline.is_playing = false;

      this.switchCameraView();
      if (this.activeScene.hot_items) {
        this.activeScene.hot_items.forEach((element) => {
          element.visible = true;
        });
      }
    } else {
      this.timeline.is_playing = true;
      this.timeline.scrubber_frame_position = 0;
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
    const result = this.sceneManager?.render_outliner(this.timeline.characters);
    if (result) outlinerState.items.value = result.items;
    this.updateSelectedUI();
  }

  updateSelectedUI() {
    let mainSelected;
    if (this.outliner_feature_flag) {
      if (
        this.sceneManager?.selected_objects === undefined ||
        this.timeline.is_playing
      ) {
        return;
      }
      if (this.sceneManager?.selected_objects.length <= 0) {
        return 0;
      }

      mainSelected = this.sceneManager?.selected_objects[0];
    } else {
      if (this.timeline.is_playing) {
        return;
      }

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
    updateObjectPanel({
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

  // Automaticly resize scene.
  onWindowResize() {
    this.containerMayReset();
    if (!this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (this.camera == undefined || this.renderer == undefined) {
      return;
    }
    // Set the camera aspect to the desired aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Set the renderer size to the calculated dimensions
    this.renderer.setSize(width, height);
    if (this.composer != null) {
      this.composer.setSize(width, height);
    }

    this.render_composer?.setSize(width, height);

    if (this.render_camera == undefined) {
      return;
    }

    this.customOutlinerPass?.setSize(width, height);
    this.render_camera.aspect = this.getRenderDimensions().aspectRatio;
    this.render_camera.updateProjectionMatrix();
  }

  setupResizeObserver() {
    this.containerMayReset();

    if (!this.container) {
      return;
    }

    this.containerResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (this.camera) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
        }
        this.renderer?.setSize(width, height);
        this.renderer?.setPixelRatio(window.devicePixelRatio);
      }
    });

    this.containerResizeObserver.observe(this.container);
  }

  getAssetType(selected: THREE.Object3D<THREE.Object3DEventMap>): AssetType {
    if (selected.type === "Mesh") {
      return selected.name === "::CAM::" ? AssetType.CAMERA : AssetType.OBJECT;
    }
    return AssetType.CHARACTER;
  }

  publishSelect() {
    if ((this, this.outliner_feature_flag)) {
      if (
        this.sceneManager?.selected_objects &&
        this.sceneManager?.selected_objects?.length > 0
      ) {
        Queue.publish({
          queueName: QueueNames.FROM_ENGINE,
          action: fromEngineActions.SELECT_OBJECT,
          data: {
            type: this.getAssetType(this.sceneManager?.selected_objects[0]),
            object_uuid: this.sceneManager?.selected_objects[0].uuid,
            version: 1,
            media_id: this.sceneManager?.selected_objects[0].id.toString(),
            name: "",
          } as MediaItem,
        });
        return;
      } else {
        Queue.publish({
          queueName: QueueNames.FROM_ENGINE,
          action: fromEngineActions.DESELECT_OBJECT,
          data: null,
        });
      }
    } else {
      if (this.selected) {
        Queue.publish({
          queueName: QueueNames.FROM_ENGINE,
          action: fromEngineActions.SELECT_OBJECT,
          data: {
            type: this.getAssetType(this.selected),
            object_uuid: this.selected.uuid,
            version: 1,
            media_id: this.selected.id.toString(),
            name: "",
          } as MediaItem,
        });
        return;
      } else {
        Queue.publish({
          queueName: QueueNames.FROM_ENGINE,
          action: fromEngineActions.DESELECT_OBJECT,
          data: null,
        });
      }
    }
  }
}

export default Editor;
