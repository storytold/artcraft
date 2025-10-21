import * as THREE from "three";
import {
  hideObjectPanel,
  hotkeysStatus,
  outlinerState,
  showObjectPanel,
  assetModalVisible,
  assetModalVisibleDuringDrag,
} from "../signals";
import {
  OrbitControls,
  OutlinePass,
  PointerLockControls,
} from "three/examples/jsm/Addons.js";
import { TransformControls } from "./TransformControls";
import { SceneManager, SceneObject } from "./scene_manager_api";
import { FreeCam, isPointerLockSupported } from "./free_cam";
import { FKHelper } from "./KinHelpers/FKHelper";
import {
  selectedMode,
  poseMode,
  showPoseControls,
} from "../signals/selectedMode";
import { Euler } from "three";

const EDITABLE_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "password",
  "number",
  "url",
  "tel",
]);

const isEventFromEditableElement = (event: KeyboardEvent): boolean => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target instanceof HTMLInputElement) {
    if (target.disabled || target.readOnly) {
      return false;
    }

    const type = target.type?.toLowerCase() ?? "";
    return type === "" || EDITABLE_INPUT_TYPES.has(type);
  }

  if (target instanceof HTMLTextAreaElement) {
    return !(target.disabled || target.readOnly);
  }

  return target.isContentEditable;
};

export enum KinMode {
  FK,
  IK,
  NONE,
}

export class MouseControls {
  camera: THREE.PerspectiveCamera | null;
  camera_person_mode: boolean;
  lockControls: PointerLockControls | undefined;
  camera_last_pos: THREE.Vector3;
  selected: THREE.Object3D[] | undefined;
  orbitControls: OrbitControls | undefined;
  selectedCanvas: boolean;
  switchPreviewToggle: boolean;
  rendering: boolean;
  togglePlayback: Function;
  deleteObject: Function;
  canvReference: HTMLCanvasElement | null = null;
  mouse: THREE.Vector2 | undefined;
  timeline_mouse: THREE.Vector2 | undefined;
  control: TransformControls | undefined;
  raycaster: THREE.Raycaster | undefined;
  outlinePass: OutlinePass | undefined;
  scene: THREE.Scene;
  publishSelect: Function;
  updateSelectedUI: Function;
  transform_interaction: boolean;
  last_selected: THREE.Object3D[] | undefined;
  getAssetType: Function;
  setSelected: Function;
  sceneManager: SceneManager | undefined;
  private isProcessing: boolean = false;
  private cameraViewControls: FreeCam;
  private isMouseClicked: boolean = false;
  private isMovable: Function;
  enable_stats: Function;

  private kinMode: KinMode = KinMode.NONE;
  private fkHelper: FKHelper;
  private isBoneDragged: boolean = false;
  private ignoreNextClick: boolean = false;
  private manualMouseLock = false;

  constructor(
    camera: THREE.PerspectiveCamera,
    camera_person_mode: boolean,
    cameraViewControls: FreeCam,
    lockControls: PointerLockControls | undefined,
    camera_last_pos: THREE.Vector3,
    selectedCanvas: boolean,
    switchPreviewToggle: boolean,
    rendering: boolean,
    togglePlayback: Function,
    deleteObject: Function,
    canvReference: HTMLCanvasElement | null,
    mouse: THREE.Vector2 | undefined,
    timeline_mouse: THREE.Vector2 | undefined,
    raycaster: THREE.Raycaster | undefined,
    control: TransformControls,
    outlinePass: OutlinePass | undefined,
    scene: THREE.Scene,
    publishSelect: Function,
    updateSelectedUI: Function,
    transform_interaction: boolean,
    last_selected: THREE.Object3D | undefined,
    getAssetType: Function,
    setSelected: Function,
    isMovable: Function,
    enable_stats: Function,
  ) {
    this.camera = camera;
    this.camera_person_mode = camera_person_mode;
    this.cameraViewControls = cameraViewControls;
    this.lockControls = lockControls;
    this.camera_last_pos = camera_last_pos;
    this.selected = [];
    this.selectedCanvas = selectedCanvas;
    this.switchPreviewToggle = switchPreviewToggle;
    this.rendering = rendering;
    this.togglePlayback = togglePlayback;
    this.deleteObject = deleteObject;
    this.canvReference = canvReference;
    this.mouse = mouse;
    this.timeline_mouse = timeline_mouse;
    this.raycaster = raycaster;
    this.control = control;
    this.outlinePass = outlinePass;
    this.scene = scene;
    this.publishSelect = publishSelect;
    this.updateSelectedUI = updateSelectedUI;
    this.transform_interaction = transform_interaction;
    this.last_selected = [];
    this.getAssetType = getAssetType;
    this.setSelected = setSelected;
    this.sceneManager = undefined;
    this.isMovable = isMovable;
    this.enable_stats = enable_stats;
    this.fkHelper = new FKHelper({
      camera: this.camera,
      domElement: this.control.domElement,
      scene: this.scene,
      onDragChange: this.onFKControlsDragging.bind(this),
    });

    // Expose handlePoseModeChange to window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__mouseControls = this;
  }

  onFKControlsDragging(dragging: boolean) {
    this.isBoneDragged = dragging;

    // FIX: Window dispatches a click event after FK dragging is complete
    // This flag can be used to ignore that when FK is adjusted
    this.ignoreNextClick = true;
  }

  clearFKVisuals() {
    this.fkHelper.clear();
  }

  focus() {
    if (this.lockControls && this.selected) {
      this.lockControls.camera.lookAt(this.selected[0].position);
      this.lockControls.camera.position.copy(this.selected[0].position);
      this.lockControls.moveForward(-5);
      this.lockControls.camera.position.add(new THREE.Vector3(0, 5, 0));
      this.lockControls.camera.lookAt(this.selected[0].position);
    }
  }

  removeTransformControls(remove_outline: boolean = true) {
    if (this.control == undefined) {
      return;
    }
    if (this.outlinePass == undefined) {
      return;
    }
    if (remove_outline) {
      this.last_selected = this.selected;
      this.selected = [];
      this.publishSelect();
    }
    this.hideTransformControls();
    if (remove_outline) this.outlinePass.selectedObjects = [];
  }

  hideTransformControls() {
    if (this.control == undefined) {
      return;
    }

    this.control.detach();
    this.scene.remove(this.control);
  }

  reattachTransformControls() {
    if (this.control == undefined || this.selected == undefined) {
      return;
    }

    this.control.attach(this.selected[0]);
    this.scene.add(this.control);
  }

  selectObject(currentObject: THREE.Object3D) {
    this.selected = [currentObject];
    this.setSelected(this.selected);
    this.publishSelect();

    if (currentObject.userData.isCharacter) {
      showPoseControls.value = true;
    }

    // Normal selection behavior
    if (currentObject.userData["locked"] !== true && this.control) {
      this.scene.add(this.control);
      this.control.attach(currentObject);
    }

    if (this.selected && this.outlinePass) {
      this.outlinePass.selectedObjects = this.selected;
    }
    this.transform_interaction = true;
    // Contact react land
    showObjectPanel();
    this.updateSelectedUI();
  }

  onMouseDown(event: any) {
    if (
      (event.button === 0 || event.button === 1) &&
      this.isMovable() &&
      !this.isBoneDragged
    ) {
      this.isMouseClicked = true;
    }
  }

  onMouseUp(event: any) {
    if (event.button === 0 || event.button === 1) {
      this.lockControls?.unlock();
      this.isMouseClicked = false;
    }

    if (event.button !== 0 && this.camera) {
      const camera_pos = new THREE.Vector3(
        parseFloat(this.camera.position.x.toFixed(2)),
        parseFloat(this.camera.position.y.toFixed(2)),
        parseFloat(this.camera.position.z.toFixed(2)),
      );
      this.camera_last_pos.copy(camera_pos);
    }
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  toggleFKMode() {
    if (this.kinMode == KinMode.FK) {
      this.fkHelper.clear();
      this.kinMode = KinMode.NONE;
      this.reattachTransformControls();
      if (poseMode.value === "pose") {
        poseMode.value = "select";
      }
      console.log("FK mode off");
      return;
    }

    // Make sure we have an intersection
    if (!(this.selected && this.selected.length > 0)) {
      return;
    }

    // Make sure FK is supported only on character type objects
    const firstSelection = this.selected[0];
    if (!firstSelection.userData.isCharacter) {
      return;
    }

    // FK is good to go
    // Disable main transform controls
    this.hideTransformControls();
    this.kinMode = KinMode.FK;
    this.fkHelper.setTarget(this.selected[0]);
    if (poseMode.value === "select") {
      poseMode.value = "pose";
    }
    console.log("FK mode on");
    return;
  }

  async onkeydown(event: KeyboardEvent) {
    if (isEventFromEditableElement(event)) {
      return;
    }

    if (hotkeysStatus.value.disabled) {
      return;
    } else if (event.key === "f" && this.selected && this.lockControls) {
      this.focus();
      return;
    } else if (event.key === " ") {
      if (!this.rendering && !this.switchPreviewToggle && this.selectedCanvas) {
        this.togglePlayback();
      }
      return;
    } else if (event.key === "Backspace" || event.key === "Delete") {
      if (this.selected) {
        this.selected.forEach((selected) => {
          this.deleteObject(selected.uuid);
          this.selected = [];
          if (this.kinMode === KinMode.FK) {
            this.toggleFKMode();
          }
          this.removeTransformControls();
          showPoseControls.value = false;
        });
      }
      return;
    } else if (event.key === "t") {
      // transform
      this.control?.setMode("translate");
      selectedMode.value = "move";
      return;
    } else if (event.key === "r" && !event.ctrlKey) {
      // rotate
      this.control?.setMode("rotate");
      selectedMode.value = "rotate";
      return;
    } else if (event.key === "g") {
      // scale
      this.control?.setMode("scale");
      selectedMode.value = "scale";
      return;
    } else if (event.key === "k") {
      this.toggleFKMode();
      return;
    } else if (event.key === "b") {
      // Open asset modal
      assetModalVisible.value = true;
      assetModalVisibleDuringDrag.value = true;
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !this.isProcessing) {
      const keyLower = event.key.toLowerCase();
      if (keyLower === "z") {
        // redo
        this.isProcessing = true;
        await this.sceneManager?.redo();
        this.isProcessing = false;
      } else if (keyLower === "c") {
        // Copy
        event.preventDefault();
        event.stopPropagation();
        this.isProcessing = true;
        await this.sceneManager?.copy();
        this.isProcessing = false;
      } else if (keyLower === "v") {
        // Paste
        event.preventDefault();
        event.stopPropagation();
        this.isProcessing = true;
        await this.sceneManager?.paste();
        this.isProcessing = false;
      } else if (event.key === "0") {
        // Stats Menu
        this.enable_stats();
      }
    }

    // Prevent browser shortcuts for Alt combinations
    if (
      event.altKey &&
      (event.key === "Alt" || event.key.toLowerCase() === "d")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (event.shiftKey) {
      this.cameraViewControls.movementSpeed = 3;
    } else if (event.altKey) {
      this.cameraViewControls.movementSpeed = 0.1;
    } else {
      this.cameraViewControls.movementSpeed = 0.75;
    }

    if (event.key === "Escape") {
      if (poseMode.value === "pose") {
        this.toggleFKMode();
        return;
      } else if (this.selected && this.selected.length > 0) {
        this.removeTransformControls();
        hideObjectPanel();
        showPoseControls.value = false;
      }
    }
  }

  handleMousePointerLock() {
    if (this.isMouseClicked && this.lockControls) {
      if (this.lockControls.isLocked == false) {
        this.lockControls.lock();
      }
    } else if (this.lockControls) {
      if (this.lockControls.isLocked == true) {
        this.lockControls.unlock();
      }
    }
  }

  handleMouseManualLock(event: MouseEvent) {
    if (this.isMouseClicked && this.lockControls) {
      // If the mouse is clicked and the lockControls is not locked, lock it
      if (this.lockControls.isLocked == false) {
        // Lock the mouse flag
        this.lockControls.isLocked = true;

        // Change the cursor to a dragging cursor
        this.lockControls.domElement.style.cursor = "move";
        console.log("Mouse locked manually");
        return;
      }

      // If the mouse is clicked but controls also locked, move the camera with the mouse
      const camera = this.lockControls.getObject();
      const _euler = new Euler(0, 0, 0, "YXZ");
      const _MOUSE_SENSITIVITY = 0.002;
      const pointerSpeed = 1.0;
      const _PI_2 = Math.PI / 2;
      const minPolarAngle = 0;
      const maxPolarAngle = Math.PI;

      _euler.setFromQuaternion(camera.quaternion);

      _euler.y -= event.movementX * _MOUSE_SENSITIVITY * pointerSpeed;
      _euler.x -= event.movementY * _MOUSE_SENSITIVITY * pointerSpeed;

      _euler.x = Math.max(
        _PI_2 - maxPolarAngle,
        Math.min(_PI_2 - minPolarAngle, _euler.x),
      );

      camera.quaternion.setFromEuler(_euler);
    } else if (this.lockControls) {
      if (this.lockControls.isLocked == true) {
        // Unlock the mouse flag
        this.lockControls.isLocked = false;

        // Change the cursor back to default
        this.lockControls.domElement.style.cursor = "default";
        console.log("Mouse unlocked manually");
      }
    }
  }

  // Sets new mouse location usually used in raycasts.
  onMouseMove(event: MouseEvent) {
    if (this.canvReference == undefined) {
      return;
    }
    const rect = this.canvReference.getBoundingClientRect();
    if (this.mouse == undefined) {
      return;
    }
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.timeline_mouse = this.mouse;

    // this causes an issue  https://discourse.threejs.org/t/unable-to-use-pointer-lock-api/11092
    if (!isPointerLockSupported()) {
      this.handleMouseManualLock(event);
    } else {
      this.handleMousePointerLock();
    }
  }

  // When the mouse clicks the screen.
  onMouseClick() {
    if (this.camera == undefined) {
      return;
    }

    // Ignore window clicks if FK is active and bone is being transformed
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false;
      return;
    }

    const camera_pos = new THREE.Vector3(
      parseFloat(this.camera.position.x.toFixed(2)),
      parseFloat(this.camera.position.y.toFixed(2)),
      parseFloat(this.camera.position.z.toFixed(2)),
    );
    if (this.camera_last_pos.equals(new THREE.Vector3(0, 0, 0))) {
      this.camera_last_pos.copy(camera_pos);
    }

    if (
      this.raycaster == undefined ||
      this.mouse == undefined ||
      this.control == undefined ||
      this.outlinePass == undefined ||
      !this.camera_last_pos.equals(camera_pos)
    ) {
      this.camera_last_pos.copy(camera_pos);
      return;
    }
    this.camera_last_pos.copy(camera_pos);

    if (this.kinMode == KinMode.FK) {
      this.fkHelper.onMouseClick(this.mouse);
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const interactable: any[] = [];
    this.scene.children.forEach((child: THREE.Object3D) => {
      if (child.name != "") {
        if (
          child.type == "Mesh" ||
          child.type == "Object3D" ||
          child.type == "Group" ||
          child.type == "SkinnedMesh"
        ) {
          interactable.push(child);
        }
      }
    });
    const intersects = this.raycaster.intersectObjects(interactable, true);

    if (intersects.length > 0) {
      if (intersects[0].object.type != "GridHelper") {
        let currentObject = intersects[0].object;
        while (currentObject.parent && currentObject.parent.type !== "Scene") {
          currentObject = currentObject.parent;
        }

        this.selected = [];

        // Show panel here
        if (currentObject.type == "Scene") {
          this.selected?.push(intersects[0].object);
        } else {
          this.selected?.push(currentObject);
        }

        this.selectObject(currentObject);
      }
    } else {
      this.selected = [];
      this.setSelected(this.selected);
      this.removeTransformControls();
      hideObjectPanel();
      showPoseControls.value = false;
    }

    if (this.sceneManager) {
      const selected: SceneObject | null = this.sceneManager.selected();
      outlinerState.selectedItem.value = selected;
    }
  }
}
