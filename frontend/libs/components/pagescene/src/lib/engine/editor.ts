import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Scene from "./scene";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { CameraAspectRatio, ClipGroup } from "../enums";
import { SceneUtils } from "./helper";
import { MouseControls } from "./keybinds_controls";
import { SaveManager } from "./save_manager";

import { SceneGenereationMetaData } from "../models/sceneGenerationMetadata";
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
import { ensureAmmoLoaded } from "./ammoLoader";
import { EngineEventBus } from "./events/EngineEventBus";
import { EngineStoreBridge } from "./EngineStoreBridge";
import {
  EditorStateChangedEvent,
  EngineInitializedEvent,
  GridVisibleChangedEvent,
  InspectorPanelChangedEvent,
  SceneLoadedEvent,
  SceneResetEvent,
  TransformSpaceChangedEvent,
} from "./events/EngineEvent";
import type { PageSceneAdapter } from "../adapter";

export type EditorInitializeConfig = {
  sceneToken: string;
  editorCanvasEl: HTMLCanvasElement;
  camViewCanvasEl: HTMLCanvasElement;
  sceneContainerEl: HTMLDivElement;
  cacheJsonString?: string;
};

class Editor {
  version: number;
  activeScene: Scene;
  renderer: THREE.WebGLRenderer | undefined;
  sparkRenderer: SparkRenderer | null = null;
  rawRenderer: THREE.WebGLRenderer | undefined;
  clock: THREE.Clock | undefined;

  raycaster: THREE.Raycaster | undefined;
  mouse: THREE.Vector2 | undefined;
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

  // Typed event bus the engine emits onto. EngineStoreBridge subscribes
  // once at construction and is the only file under engine/ that
  // imports the Zustand store.
  bus: EngineEventBus;
  private storeBridge: EngineStoreBridge;
  // Store→engine reactor for grid visibility (toggling the gridHelper
  // mesh in/out of the THREE.js scene). Cleared on unmountEngine.
  private gridSubscription: () => void;

  // Holds the in-flight transform action between gizmo dragstart and
  // dragend. Null whenever no drag is in progress.
  private activeTransform: TransformAction | null = null;

  // Forwarding getter — ControlPanelSceneObject reads `editor.selected`.
  get selected(): THREE.Object3D | undefined {
    return this.selection.selected;
  }

  // Read-side facade for engine-internal callers (keymap, hooks) that
  // need to consult the store without importing it directly. Keeps the
  // store import scoped to Editor + EngineStoreBridge.
  getPoseMode(): "select" | "pose" {
    return usePageSceneStore.getState().poseMode;
  }

  utils: SceneUtils;
  mouse_controls: MouseControls | undefined;
  save_manager: SaveManager;

  sceneManager: SceneManager | undefined;

  // Platform-abstraction surface — the host wires Tauri/HTTP plumbing
  // through this. Held on the Editor so subsystems that need it
  // (Scene's fetchAsset, SaveManager.saveSceneState, etc.) can read
  // it without re-injection. Public so tests can substitute fakes.
  readonly adapter: PageSceneAdapter;

  // True when the user is allowed to drive the camera with the mouse
  // (left/middle-click look-around). Flipped to false WHILE a gizmo
  // handle is being dragged, then back to true on dragend so the
  // gizmo drag doesn't accidentally pan the camera. Defaults to true
  // so camera controls are available before the user has touched the
  // gizmo for the first time.
  focused: boolean = true;

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

  constructor(adapter: PageSceneAdapter) {
    console.log(
      "If you see this message twice! then it rendered twice, if you see it once it's all good.",
    );
    this.adapter = adapter;
    this.can_initialize = true;
    this.stats = new Stats();
    // Ammo.js WASM is a global side-effect script the physics path
    // depends on. The singleton ensures it's appended to document.body
    // exactly once, even across Editor re-construction.
    ensureAmmoLoaded();

    // Version and name.
    this.version = 2.0;
    // Clock, scene and camera essentials.

    // Bus + bridge must exist before any subsystem that emits events.
    // The bridge is the only file under engine/ that imports the Zustand
    // store; every other engine→store write goes through `this.bus.emit`.
    this.bus = new EngineEventBus();
    this.storeBridge = new EngineStoreBridge({ bus: this.bus });

    // Engine-side reactor for grid visibility. Keeps the write flow
    // strictly one-way: UI toggles emit GridVisibleChangedEvent on the
    // bus → bridge updates the store + this subscriber updates the
    // THREE.js gridHelper. No "store→engine" subscription anywhere.
    this.gridSubscription = this.bus.subscribe(GridVisibleChangedEvent, (e) =>
      this.activeScene?.applyGridVisibility(e.visible),
    );

    // PostProcessingPipeline must exist before Scene because Scene's
    // load paths invoke updateSurfaceIdAttributeToMesh as a callback.
    this.postProcessing = new PostProcessingPipeline();
    this.gizmo = new GizmoController({
      getTransformSpace: () => usePageSceneStore.getState().transformSpace,
      setTransformSpace: (space) =>
        this.bus.emit(new TransformSpaceChangedEvent(space)),
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
        this.bus.emit(new EditorStateChangedEvent(state)),
      hideObjectPanel: () =>
        this.bus.emit(new InspectorPanelChangedEvent(null)),
      getCameras: () => usePageSceneStore.getState().cameras,
      getSelectedCameraId: () => usePageSceneStore.getState().selectedCameraId,
      bus: this.bus,
    });
    this.selection = new SelectionBridge({
      getSceneManager: () => this.sceneManager,
      cameraName: this.cameraController.camera_name,
      version: this.version,
      toggleObjectLocked: (uuid) => this.utils.toggleObjectLocked(uuid),
      setObjectLocked: (uuid, locked) =>
        this.utils.setObjectLocked(uuid, locked),
      isObjectLocked: (uuid) => this.utils.isObjectLocked(uuid),
      removeTransformControls: () => this.utils.removeTransformControls(false),
      attachGizmoToCurrentSelection: () => {
        this.gizmo.addToScene(this.activeScene.scene);
        const selected = this.sceneManager?.selected_objects?.[0];
        if (selected) this.gizmo.attach(selected);
      },
      bus: this.bus,
      getCharactersByUuid: () => {
        const characters = usePageSceneStore.getState().characters;
        const result: { [uuid: string]: ClipGroup } = {};
        for (const c of characters) result[c.id] = ClipGroup.CHARACTER;
        return result;
      },
      isCharacterUuid: (uuid) =>
        usePageSceneStore.getState().characters.some((c) => c.id === uuid),
    });

    this.activeScene = new Scene(
      "" + this.version,
      this.cameraController.camera_name,
      (scene: THREE.Scene) =>
        this.postProcessing.updateSurfaceIdAttributeToMesh(scene),
      this.version,
      {
        getCameras: () => usePageSceneStore.getState().cameras,
        getSelectedCameraId: () =>
          usePageSceneStore.getState().selectedCameraId,
        fetchAsset: (url, init) => this.adapter.fetchAsset(url, init),
        getMediaUrlByToken: (token) => this.adapter.getMediaUrlByToken(token),
        getMediaUrlsByTokens: this.adapter.getMediaUrlsByTokens
          ? (tokens) => this.adapter.getMediaUrlsByTokens!(tokens)
          : undefined,
      },
    );
    this.activeScene.initialize();
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
      getSelectionPass: () => this.postProcessing.selectionPass,
      publishSelect: () => this.selection.publishSelect(),
      clearSelected: () => {
        this.selection.selected = undefined;
      },
      getCameraName: () => this.cameraController.camera_name,
      getSelectedObject: () => this.sceneManager?.selected_objects?.[0],
      getThreeScene: () => this.activeScene.scene,
      bus: this.bus,
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
      saveSceneState: (args) => this.adapter.saveScene(args),
      loadSceneState: (token) => this.adapter.loadScene(token),
      getCameras: () => usePageSceneStore.getState().cameras,
      getSelectedCameraId: () => usePageSceneStore.getState().selectedCameraId,
      bus: this.bus,
    });
    this.viewport = new ViewportController({
      getCamera: () => this.cameraController.camera,
      getRenderCamera: () => this.cameraController.render_camera,
      getRenderer: () => this.renderer,
      getRenderAspectRatio: () =>
        this.cameraController.getRenderDimensions().aspectRatio,
      resizePostProcessing: (w, h) => this.postProcessing.resize(w, h),
      renderScene: () => {
        // Fire-and-forget: renderScene is async only for optional
        // post-processing branches; the underlying Three.js render is
        // synchronous and that's all the viewport needs to avoid a
        // blank frame after setSize.
        void this.renderScene();
      },
    });

    // Action classes under engine/editor/actions/ encapsulate their own
    // apply/revert + dependencies. HistoryManager just stores them.
    this.history = new HistoryManager({ capacity: 64 });

    this.positive_prompt =
      "((masterpiece, best quality, 8K, detailed)), colorful, epic, fantasy, (fox, red fox:1.2), no humans, 1other, ((koi pond)), outdoors, pond, rocks, stones, koi fish, ((watercolor))), lilypad, fish swimming around.";

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

    // Use the container's dimensions. Clamp to ≥1 because the host's
    // flex chain isn't always laid out by the time we initialize (e.g.
    // the webapp's SidebarInset settles a frame after first render),
    // and a 0-sized renderer leaks INVALID_FRAMEBUFFER_OPERATION warnings
    // from the post-processing pipeline until the next resize event
    // recovers. The next resize cascade re-sizes the renderer to the
    // real dimensions, so this is just guard rails for the first frame.
    const width = Math.max(1, this.viewport.container.offsetWidth);
    const height = Math.max(1, this.viewport.container.offsetHeight);

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
      this.viewport.canvReference?.width || 1,
      this.viewport.canvReference?.height || 1,
    );
    // Controls and movement.

    if (this.cameraController.camera) {
      this.cameraController.lockControls = new PointerLockControls(
        this.cameraController.camera,
        this.renderer.domElement,
      );
      // Restore the quaternion captured at mouseup. Chromium synthesizes
      // one final `mousemove` while exiting pointer lock so it can
      // reposition the cursor; PLC reads that synthesized delta and
      // rotates the camera by it because `isLocked` is still true at
      // that moment. By the time the `unlock` event fires here, that
      // synthetic move has already been applied — overwriting it with
      // the pre-unlock snapshot keeps the camera at the orientation the
      // user actually released on.
      this.cameraController.lockControls.addEventListener("unlock", () => {
        const snap = this.mouse_controls?.quatAtUnlockRequest;
        const cam = this.cameraController.camera;
        if (snap && cam) {
          cam.quaternion.copy(snap);
          cam.updateMatrixWorld();
        }
        if (this.mouse_controls) {
          this.mouse_controls.quatAtUnlockRequest = null;
        }
      });
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

    this.mouse_controls = new MouseControls({
      camera: this.cameraController.camera,
      camera_person_mode: this.cameraController.getCameraPersonMode.bind(
        this.cameraController,
      ) as unknown as boolean,
      cameraViewControls: this.cameraController.freeCamState,
      lockControls: this.cameraController.lockControls,
      camera_last_pos: this.cameraController.camera_last_pos,
      deleteObject: this.deleteObject.bind(this),
      canvReference: this.viewport.canvReference,
      mouse: this.mouse,
      timeline_mouse: this.mouse,
      raycaster: this.raycaster,
      control: this.gizmo.control,
      selectionPass: this.postProcessing.selectionPass,
      scene: this.activeScene.scene,
      publishSelect: this.selection.publishSelect.bind(this.selection),
      updateSelectedUI: this.selection.updateSelectedUI.bind(this.selection),
      transform_interaction: false,
      last_selected: undefined,
      getAssetType: this.selection.getAssetType.bind(this.selection),
      setSelected: this.selection.setSelected.bind(this.selection),
      isMovable: this.isMovable.bind(this),
      toggle_stats: this.toggle_stats.bind(this),
      bus: this.bus,
      getPoseMode: () => usePageSceneStore.getState().poseMode,
      isHotkeyDisabled: () =>
        usePageSceneStore.getState().hotkeyStatus.disabled,
      getTransformSpace: () => usePageSceneStore.getState().transformSpace,
    });

    this.sceneManager = new SceneManager(
      this.version,
      this.mouse_controls,
      this.activeScene,
      this.bus,
    );
    this.mouse_controls.sceneManager = this.sceneManager;

    // Add spark renderer as a child of the camera
    // this.activeScene.scene.add(this.sparkRenderer);
    // this.camera?.add(this.sparkRenderer);

    const onloadCallback = () => {
      console.log("Setting Scene is loaded");
      this._isEngineDataLoaded = true;

      this.selection.refreshOutliner();

      this.bus.emit(new SceneLoadedEvent(true));
    };

    // Only flip the loaded flag when the load actually applied — a
    // load that was superseded by a newer one (rapid remount or
    // unmount-during-load) resolves with applied=false and must NOT
    // touch engine state, otherwise EngineProvider's unmount handler
    // would try to serialize a half-loaded scene back into the cache.
    const applyIfLoaded = (result: { applied: boolean }) => {
      if (result.applied) onloadCallback();
    };

    if (!this.utils.isEmpty(cacheJson)) {
      this.save_manager.loadCache(cacheJson).then(applyIfLoaded);
    } else if (!this.utils.isEmpty(sceneToken)) {
      this.save_manager.loadScene(sceneToken).then(applyIfLoaded);
    } else {
      this.adapter.onSceneTitleChange?.({
        title: "Untitled New Scene",
        token: undefined,
        ownerToken: this.adapter.getCurrentUserToken?.(),
        isModified: false,
      });
      onloadCallback();
    }

    this.postProcessing.configureRaw(
      this.rawRenderer,
      this.activeScene.scene,
      this.cameraController.render_camera,
      this.viewport.canvasRenderCamReference?.width || 1,
      this.viewport.canvasRenderCamReference?.height || 1,
    );

    this.bus.emit(new EngineInitializedEvent(true));

    // This will enable all event and render loops
    // We'll disable it here so the UI events can control is manually
    this.remountEngine();
  }

  public isMovable(): boolean {
    return this.focused;
  }

  // Toggle the three.js Stats panel (FPS / ms / mb). Bound to the
  // backtick key in MouseControls. The flag lives in the Zustand
  // store; <PerfStatsOverlay/> mounted inside PageScene watches it and
  // attaches/detaches `this.stats.dom` to a React-managed container,
  // so the panel is scoped to the PageScene route rather than the
  // document body.
  public toggle_stats() {
    usePageSceneStore.getState().toggleStats();
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

    // Store grid visibility state and hide grid for the snapshot. The
    // store is the source of truth (Scene's subscriber re-syncs the
    // gridHelper); we emit through the bus to keep the boundary clean.
    const wasGridVisible = store.gridVisible;
    this.bus.emit(new GridVisibleChangedEvent(false));

    // Store and hide transform controls
    const wasControlVisible = this.gizmo.isVisible();
    this.gizmo.setVisible(false);

    // Suppress the selection outline overlay (and splat bbox) so the
    // snapshot is clean. We can't disable the pass outright — it now owns
    // the forward scene render, so a disabled pass yields a gray frame.
    const selectionPass = this.postProcessing.selectionPass;
    selectionPass?.setOutlineSuppressed(true);

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
    this.bus.emit(new GridVisibleChangedEvent(wasGridVisible));

    // Restore transform controls visibility
    this.gizmo.setVisible(wasControlVisible);

    // Restore outline overlay + splat bbox
    selectionPass?.setOutlineSuppressed(false);

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
    this.adapter.onSceneTitleChange?.({
      title: sceneTitle,
      token: undefined,
      ownerToken: this.adapter.getCurrentUserToken?.(),
      isModified: false,
    });
    this.bus.emit(new SceneResetEvent());

    this.selection.refreshOutliner();
  }

  public async loadCache(cacheJson: string): Promise<{ applied: boolean }> {
    return await this.save_manager.loadCache(cacheJson);
  }

  public async loadScene(
    scene_media_token: string,
  ): Promise<{ applied: boolean }> {
    const result = await this.save_manager.loadScene(scene_media_token);
    if (result.applied) this.selection.refreshOutliner();
    return result;
  }

  // Replace the active scene with the provided serialized JSON, clear
  // the undo stack, and fire SceneResetEvent. Used by the Reset-to-
  // original flow so the user can't "undo" the reset back into their
  // edits. Delegates to save_manager.loadCache which already owns the
  // JSON-string deserialization path used on initial mount.
  public async applyJson(jsonString: string) {
    const result = await this.save_manager.loadCache(jsonString);
    if (!result.applied) return;
    this.history.clear();
    this.bus.emit(new SceneResetEvent());
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
    const { render_camera, render_width, render_height } =
      this.cameraController;
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
        this.viewport.container.clientWidth +
          this.viewport.container.clientHeight !==
        this.viewport.lastCanvasSize
      ) {
        this.viewport.onWindowResize();
        this.viewport.lastCanvasSize =
          this.viewport.container.clientWidth +
          this.viewport.container.clientHeight;
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
    // Cancel any in-flight load so late-arriving asset promises bail
    // at their next checkpoint instead of mutating the about-to-be-
    // disposed scene. Also aborts in-flight asset downloads.
    this.save_manager.cancelCurrentLoad();

    this.bus.emit(new SceneLoadedEvent(false));
    this.stopRenderLoop();

    // Fix: dispose 3D contexts
    this.renderer?.dispose();
    this.postProcessing.dispose();
    this.rawRenderer?.dispose();

    this.isMounted = false;
    this.bus.emit(new EngineInitializedEvent(false));
    this.gridSubscription();
    this.storeBridge.dispose();
    console.log("3D Editor Engine unmounted");
  }
}

export default Editor;
