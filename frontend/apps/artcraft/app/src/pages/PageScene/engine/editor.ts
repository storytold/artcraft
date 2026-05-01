import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Scene from "./scene.js";
import { APIManager } from "./api_manager.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { CameraAspectRatio } from "~/pages/PageScene/enums";
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
import { SelectionBridge } from "./editor/SelectionBridge";
import { CameraController } from "./editor/CameraController";
import { HistoryManager } from "./editor/HistoryManager";
import { DeleteAction } from "./editor/actions/DeleteAction";
import { TransformAction } from "./editor/actions/TransformAction";

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
  renderer: THREE.WebGLRenderer | undefined;
  sparkRenderer: SparkRenderer | null = null;
  rawRenderer: THREE.WebGLRenderer | undefined;
  clock: THREE.Clock | undefined;

  raycaster: THREE.Raycaster | undefined;
  mouse: THREE.Vector2 | undefined;
  api_manager: APIManager;
  orbitControls: OrbitControls | undefined;
  locked: boolean;

  render_timer: number;
  fps_number: number;
  cap_fps: number;
  frames: number;
  lastFrameTime: number;

  can_initialize: boolean;

  positive_prompt: string;

  // Owns canvas/container DOM refs and the resize cascade.
  viewport: ViewportController;
  // Owns the EffectComposer chains and post-process passes.
  postProcessing: PostProcessingPipeline;
  // Owns the TransformControls gizmo.
  gizmo: GizmoController;
  // Owns the selection-and-outliner sync into the Zustand store.
  selection: SelectionBridge;
  // Owns the camera state, FreeCam plumbing, and the per-frame camera tick.
  cameraController: CameraController;
  // Owns the undo/redo stack. Mutation sites push UndoableAction
  // instances via editor.history.record(...); each action class under
  // engine/editor/actions/ encapsulates its own apply/revert.
  history: HistoryManager;

  // Holds the in-flight transform action between gizmo dragstart and
  // dragend. Null whenever no drag is in progress.
  private activeTransform: TransformAction | null = null;

  // Forwarding getter — ControlPanelSceneObject reads `editor.selected`.
  get selected(): THREE.Object3D | undefined {
    return this.selection.selected;
  }

  utils: SceneUtils;
  mouse_controls: MouseControls | undefined;
  save_manager: SaveManager;

  media_upload: MediaUploadApi;

  sceneManager: SceneManager | undefined;

  focused: boolean = false;

  renderIndex: number;
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
    console.log(
      "If you see this message twice! then it rendered twice, if you see it once it's all good.",
    );
    this.can_initialize = true;
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

    // PostProcessingPipeline must exist before Scene because Scene's
    // load paths invoke updateSurfaceIdAttributeToMesh as a callback.
    this.postProcessing = new PostProcessingPipeline();
    this.gizmo = new GizmoController({
      getTransformSpace: () => usePageSceneStore.getState().transformSpace,
      setTransformSpace: (space) =>
        usePageSceneStore.getState().setTransformSpace(space),
    });
    this.cameraController = new CameraController({
      getThreeScene: () => this.activeScene.scene,
      getHotItems: () => this.activeScene.hot_items ?? null,
      removeTransformControls: () => this.utils.removeTransformControls(),
      setSelected: (obj) => {
        this.selection.selected = obj ?? undefined;
        this.selection.publishSelect();
        this.selection.updateSelectedUI();
      },
      setEditorState: (state) =>
        usePageSceneStore.getState().setEditorState(state),
      hideObjectPanel: () => usePageSceneStore.getState().hideObjectPanel(),
    });
    this.selection = new SelectionBridge({
      getSceneManager: () => this.sceneManager,
      cameraName: this.cameraController.camera_name,
      version: this.version,
      toggleObjectLocked: (uuid) => this.utils.toggleObjectLocked(uuid),
      setObjectLocked: (uuid, locked) =>
        this.utils.setObjectLocked(uuid, locked),
      isObjectLocked: (uuid) => this.utils.isObjectLocked(uuid),
      removeTransformControls: () =>
        this.utils.removeTransformControls(false),
      attachGizmoToCurrentSelection: () => {
        this.gizmo.addToScene(this.activeScene.scene);
        const selected = this.sceneManager?.selected_objects?.[0];
        if (selected) this.gizmo.attach(selected);
      },
    });

    this.activeScene = new Scene(
      "" + this.version,
      this.cameraController.camera_name,
      (scene: THREE.Scene) =>
        this.postProcessing.updateSurfaceIdAttributeToMesh(scene),
      this.version,
    );
    this.activeScene.initialize();
    this.api_manager = new APIManager();
    this.locked = false;
    this.render_timer = 0;
    this.fps_number = 60;
    this.cap_fps = 60;
    this.frames = 0;
    this.lastFrameTime = 0;
    this.renderEventToken = -1;
    this.shouldRender = false;

    this.utils = new SceneUtils(this.activeScene, {
      getGizmoControl: () => this.gizmo.control,
      detachGizmo: () => this.gizmo.detach(),
      removeGizmoFromScene: () =>
        this.gizmo.removeFromScene(this.activeScene.scene),
      getOutlinePass: () => this.postProcessing.outlinePass,
      publishSelect: () => this.selection.publishSelect(),
      clearSelected: () => {
        this.selection.selected = undefined;
      },
      getCameraName: () => this.cameraController.camera_name,
      getSelectedObject: () => this.sceneManager?.selected_objects?.[0],
      getThreeScene: () => this.activeScene.scene,
    });
    this.save_manager = new SaveManager({
      getVersion: () => this.version,
      setVersion: (v) => {
        this.version = v;
      },
      getActiveScene: () => this.activeScene,
      getRenderer: () => this.renderer,
      removeTransformControls: () => this.utils.removeTransformControls(),
      getCamera: () => this.cameraController.camera,
      refreshCamObj: () =>
        this.cameraController.refreshCamObj(this.activeScene.scene),
      changeRenderCameraAspectRatio: (ratio) =>
        this.cameraController.changeRenderCameraAspectRatio(ratio),
      setPositivePrompt: (prompt) => {
        this.positive_prompt = prompt;
      },
      saveSceneState: (args) => this.api_manager.saveSceneState(args),
      loadSceneState: (token) => this.api_manager.loadSceneState(token),
    });
    this.viewport = new ViewportController({
      getCamera: () => this.cameraController.camera,
      getRenderCamera: () => this.cameraController.render_camera,
      getRenderer: () => this.renderer,
      getRenderAspectRatio: () =>
        this.cameraController.getRenderDimensions().aspectRatio,
      resizePostProcessing: (w, h) => this.postProcessing.resize(w, h),
    });

    // Action classes under engine/editor/actions/ encapsulate their own
    // apply/revert + dependencies. HistoryManager just stores them.
    this.history = new HistoryManager({ capacity: 64 });

    this.positive_prompt =
      "((masterpiece, best quality, 8K, detailed)), colorful, epic, fantasy, (fox, red fox:1.2), no humans, 1other, ((koi pond)), outdoors, pond, rocks, stones, koi fish, ((watercolor))), lilypad, fish swimming around.";

    this.media_upload = new MediaUploadApi();

    // set image type at this stage

    this.renderIndex = 0;
  }

  isEmpty(value: string | null) {
    return value === null || value.trim().length === 0;
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
      const mainCamera = new THREE.PerspectiveCamera(
        this.cameraController.focalLengthToFov(mainCameraConfig.focalLength),
        width / height,
        0.1,
        2000,
      );
      mainCamera.position.set(
        mainCameraConfig.position.x,
        mainCameraConfig.position.y,
        mainCameraConfig.position.z,
      );
      mainCamera.lookAt(
        mainCameraConfig.lookAt.x,
        mainCameraConfig.lookAt.y,
        mainCameraConfig.lookAt.z,
      );
      mainCamera.layers.enable(0);
      mainCamera.layers.enable(1);
      this.cameraController.camera = mainCamera;
    }

    const otherCameras = usePageSceneStore
      .getState()
      .cameras.filter((cam) => cam.id !== "main");
    if (otherCameras.length > 0) {
      const renderCameraConfig = otherCameras[0];
      const renderCamera = new THREE.PerspectiveCamera(
        this.cameraController.focalLengthToFov(renderCameraConfig.focalLength),
        width / height,
        0.01,
        200,
      );
      renderCamera.position.set(
        renderCameraConfig.position.x,
        renderCameraConfig.position.y,
        renderCameraConfig.position.z,
      );
      renderCamera.lookAt(
        renderCameraConfig.lookAt.x,
        renderCameraConfig.lookAt.y,
        renderCameraConfig.lookAt.z,
      );
      renderCamera.layers.disable(1); // This camera does not see this layer
      this.cameraController.render_camera = renderCamera;
    }

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
      this.cameraController.camera,
      this.viewport.canvReference?.width ?? 0,
      this.viewport.canvReference?.height ?? 0,
    );
    // Controls and movement.

    if (this.cameraController.camera) {
      this.cameraController.lockControls = new PointerLockControls(
        this.cameraController.camera,
        this.renderer.domElement,
      );
    }
    // FreeCam math + listeners now live in hooks/useFreeCam.ts; the
    // editor reads `cameraController.freeCamState` (set by that hook) on
    // every render.

    this.gizmo.configure(
      this.cameraController.camera,
      this.renderer.domElement,
      this.activeScene.scene,
      {
        onChange: () => this.renderScene(),
        onDraggingChanged: (dragging) => {
          this.selection.updateSelectedUI();
          this.cameraController.camera_last_pos.copy(
            new THREE.Vector3(-99999, -99999, -99999),
          );
          this.focused = !dragging;
          // Gizmo drag boundary → TransformAction. Begin captures the
          // pre-drag transform in the constructor; end commits the diff
          // (or drops a no-op move).
          if (dragging) {
            const target = this.sceneManager?.selected_objects?.[0];
            if (target) {
              this.activeTransform = new TransformAction(this, target.uuid);
            }
          } else if (this.activeTransform) {
            if (this.activeTransform.commit()) {
              this.history.record(this.activeTransform);
            }
            this.activeTransform = null;
          }
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

    this.cameraController.refreshCamObj(this.activeScene.scene);

    this.mouse_controls = new MouseControls(
      this.cameraController.camera,
      this.cameraController.getCameraPersonMode.bind(this.cameraController),
      this.cameraController.freeCamState,
      this.cameraController.lockControls,
      this.cameraController.camera_last_pos,
      this.deleteObject.bind(this),
      this.viewport.canvReference,
      this.mouse,
      this.mouse,
      this.raycaster,
      this.gizmo.control,
      this.postProcessing.outlinePass,
      this.activeScene.scene,
      this.selection.publishSelect.bind(this.selection),
      this.selection.updateSelectedUI.bind(this.selection),
      false,
      undefined,
      this.selection.getAssetType.bind(this.selection),
      this.selection.setSelected.bind(this.selection),
      this.isMovable.bind(this),
      this.enable_stats.bind(this),
    );

    this.sceneManager = new SceneManager(
      this.version,
      this.mouse_controls,
      this.activeScene,
    );
    this.mouse_controls.sceneManager = this.sceneManager;

    // Add spark renderer as a child of the camera
    // this.activeScene.scene.add(this.sparkRenderer);
    // this.camera?.add(this.sparkRenderer);

    const onloadCallback = () => {
      console.log("Setting Scene is loaded");
      this._isEngineDataLoaded = true;

      this.selection.refreshOutliner();

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
      this.cameraController.render_camera,
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
    const camera = this.cameraController.camera;
    const renderCamera = this.cameraController.render_camera;
    if (!this.renderer?.domElement || !camera) {
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
    const originalCameraAspect = camera.aspect;
    const originalRenderCameraAspect =
      renderCamera?.aspect || originalCameraAspect;

    // Temporarily set renderer to high resolution
    this.renderer.setSize(targetWidth, targetHeight, false);
    this.renderer.setPixelRatio(1);

    // Update camera for the new aspect ratio
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();

    // If using render camera, update it too
    if (renderCamera) {
      renderCamera.aspect = aspectRatio;
      renderCamera.updateProjectionMatrix();
    }

    // Re-render the scene at high resolution
    if (this.postProcessing.composer) {
      this.postProcessing.composer.setSize(targetWidth, targetHeight);
      this.postProcessing.composer.render();
    } else {
      this.renderer.render(this.activeScene.scene, camera);
    }

    // Get the high resolution snapshot
    const snapshot = this.renderer.domElement.toDataURL("image/png", 1.0);
    const base64Snapshot = snapshot.split(",")[1];

    // Restore original camera aspect
    camera.aspect = originalCameraAspect;
    camera.updateProjectionMatrix();

    // Restore render camera if it exists
    if (renderCamera) {
      renderCamera.aspect = originalRenderCameraAspect;
      renderCamera.updateProjectionMatrix();
    }

    // Restore original renderer size and pixel ratio
    this.renderer.setSize(originalWidth, originalHeight, false);
    this.renderer.setPixelRatio(originalPixelRatio);

    // Re-render at original resolution
    if (this.postProcessing.composer) {
      this.postProcessing.composer.setSize(originalWidth, originalHeight);
      this.postProcessing.composer.render();
    } else {
      this.renderer.render(this.activeScene.scene, camera);
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
    this.cameraController.cam_obj = this.activeScene.get_object_by_name(
      this.cameraController.camera_name,
    );
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

    this.selection.refreshOutliner();
  }

  public async loadCache(cacheJson: string) {
    await this.save_manager.loadCache(cacheJson);
  }

  public async loadScene(scene_media_token: string) {
    await this.save_manager.loadScene(scene_media_token);
    this.selection.refreshOutliner();
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

  deleteObject(uuid: string) {
    const obj = this.activeScene.scene.getObjectByProperty("uuid", uuid);
    if (obj) this.history.record(new DeleteAction(this, obj));
    this.mouse_controls?.clearFKVisuals();
    this.mouse_controls?.removeTransformControls(true);
    this.utils.deleteObject(uuid);
    this.selection.refreshOutliner();
  }

  // Render the scene to the camera, this is called in the update.
  async renderScene() {
    const { render_camera, render_width, render_height } = this.cameraController;
    if (
      this.postProcessing.composer != null &&
      this.rawRenderer &&
      this.postProcessing.render_composer
    ) {
      this.postProcessing.composer.render();
    } else if (this.renderer && render_camera) {
      this.renderer.setSize(render_width, render_height);
      this.renderer.render(this.activeScene.scene, render_camera);
    }
  }

  async renderSingleFrame() {
    //console.timeEnd("Single Frame Time");
    //console.time("Single Frame Time");
    this.viewport.containerMayReset();

    if (this.viewport.container) {
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

    this.cameraController.tickPerFrame(delta_time);

    this.activeScene.shader_objects.forEach((shader) => {
      shader.material.uniforms["time"].value += 0.5 * delta_time;
    });

    if (this.utils.getSelectedSum() !== this.selection.last_selected_sum) {
      this.selection.updateSelectedUI();
    }
    this.selection.last_selected_sum = this.utils.getSelectedSum();

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
    console.log("3D Editor Engine remounted");
  }

  unmountEngine() {
    setIs3DSceneLoaded(false);
    this.stopRenderLoop();

    // Fix: dispose 3D contexts
    this.renderer?.dispose();
    this.postProcessing.dispose();
    this.rawRenderer?.dispose();

    this.isMounted = false;
    setIs3DEditorInitialized(false);
    console.log("3D Editor Engine unmounted");
  }
}

export default Editor;
