import * as THREE from "three";
import {
  OrbitControls,
  PointerLockControls,
} from "three/examples/jsm/Addons.js";
import { TransformControls } from "./TransformControls";
import type { SelectionOutlinePass } from "./SelectionOutlinePass";
import { SceneManager, SceneObject } from "./scene_manager_api";
import { isPointerLockSupported } from "./browserChecks";
import type { FreeCamControlState } from "./cameraMath";
import { FKHelper } from "./KinHelpers/FKHelper";
import { Euler } from "three";
import type { EngineEventBus } from "./events/EngineEventBus";
import {
  AssetModalVisibilityChangedEvent,
  InspectorPanelChangedEvent,
  OutlinerSelectedItemChangedEvent,
  PoseControlsVisibilityChangedEvent,
  PoseModeChangedEvent,
  SelectedModeChangedEvent,
  TransformSpaceChangedEvent,
} from "./events/EngineEvent";
import type { PoseMode, TransformSpace } from "../PageSceneStore";

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

// Capabilities MouseControls needs from outside its own state. Editor
// wires these in inline at construction (Phase 2 idiom — same shape as
// CameraControllerDeps, SaveManagerDeps, etc.). Replaces the prior
// 20-positional-arg constructor; new fields go here, not in a 21st
// positional slot.
export type MouseControlsDeps = {
  camera: THREE.PerspectiveCamera | null;
  camera_person_mode: boolean;
  cameraViewControls: FreeCamControlState | null;
  lockControls: PointerLockControls | undefined;
  camera_last_pos: THREE.Vector3;
  deleteObject: Function;
  canvReference: HTMLCanvasElement | null;
  mouse: THREE.Vector2 | undefined;
  timeline_mouse: THREE.Vector2 | undefined;
  raycaster: THREE.Raycaster | undefined;
  control: TransformControls | undefined;
  selectionPass: SelectionOutlinePass | undefined;
  scene: THREE.Scene;
  publishSelect: Function;
  updateSelectedUI: Function;
  transform_interaction: boolean;
  last_selected: THREE.Object3D | undefined;
  getAssetType: Function;
  setSelected: Function;
  isMovable: Function;
  toggle_stats: Function;

  // Typed event bus — every engine→store write goes through here.
  bus: EngineEventBus;
  // Reads from the store happen at the boundary (Editor wires these up).
  // The class itself stays store-agnostic.
  getPoseMode: () => PoseMode;
  isHotkeyDisabled: () => boolean;
  getTransformSpace: () => TransformSpace;
};

export class MouseControls {
  camera: THREE.PerspectiveCamera | null;
  camera_person_mode: boolean;
  lockControls: PointerLockControls | undefined;
  camera_last_pos: THREE.Vector3;
  selected: THREE.Object3D[] | undefined;
  orbitControls: OrbitControls | undefined;
  deleteObject: Function;
  canvReference: HTMLCanvasElement | null = null;
  mouse: THREE.Vector2 | undefined;
  timeline_mouse: THREE.Vector2 | undefined;
  control: TransformControls | undefined;
  raycaster: THREE.Raycaster | undefined;
  selectionPass: SelectionOutlinePass | undefined;
  scene: THREE.Scene;
  publishSelect: Function;
  updateSelectedUI: Function;
  transform_interaction: boolean;
  last_selected: THREE.Object3D[] | undefined;
  getAssetType: Function;
  setSelected: Function;
  sceneManager: SceneManager | undefined;
  private isProcessing: boolean = false;
  private cameraViewControls: FreeCamControlState | null;
  private isMouseClicked: boolean = false;
  private isMovable: Function;
  toggle_stats: Function;

  private kinMode: KinMode = KinMode.NONE;
  private fkHelper: FKHelper;
  private isBoneDragged: boolean = false;
  private ignoreNextClick: boolean = false;

  // Snapshot of the camera quaternion taken in onMouseUp right before
  // lockControls.unlock(). The unlock listener in editor.ts restores
  // this value to neutralize the synthetic mousemove Chromium fires
  // while pointer-lock is releasing — that synthetic move would
  // otherwise be processed by PointerLockControls and lurch the camera
  // back by the cursor's "trip home" delta, producing a visible snap.
  quatAtUnlockRequest: THREE.Quaternion | null = null;

  // Deps held for read callbacks + bus emissions throughout the class.
  // Constructor still copies primitive fields onto `this.x` for the
  // existing internals; new code reads through `this.deps` directly.
  private deps: MouseControlsDeps;

  constructor(deps: MouseControlsDeps) {
    this.deps = deps;
    this.camera = deps.camera;
    this.camera_person_mode = deps.camera_person_mode;
    this.cameraViewControls = deps.cameraViewControls;
    this.lockControls = deps.lockControls;
    this.camera_last_pos = deps.camera_last_pos;
    this.selected = [];
    this.deleteObject = deps.deleteObject;
    this.canvReference = deps.canvReference;
    this.mouse = deps.mouse;
    this.timeline_mouse = deps.timeline_mouse;
    this.raycaster = deps.raycaster;
    this.control = deps.control;
    this.selectionPass = deps.selectionPass;
    this.scene = deps.scene;
    this.publishSelect = deps.publishSelect;
    this.updateSelectedUI = deps.updateSelectedUI;
    this.transform_interaction = deps.transform_interaction;
    this.last_selected = [];
    this.getAssetType = deps.getAssetType;
    this.setSelected = deps.setSelected;
    this.sceneManager = undefined;
    this.isMovable = deps.isMovable;
    this.toggle_stats = deps.toggle_stats;
    this.fkHelper = new FKHelper({
      camera: this.camera!,
      domElement: this.control!.domElement,
      scene: this.scene,
      onDragChange: this.onFKControlsDragging.bind(this),
    });
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
    if (this.selectionPass == undefined) {
      return;
    }
    if (remove_outline) {
      this.last_selected = this.selected;
      this.selected = [];
      this.publishSelect();
    }
    this.hideTransformControls();
    if (remove_outline) this.selectionPass.setSelectedObjects([]);
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
      this.deps.bus.emit(new PoseControlsVisibilityChangedEvent(true));
    }

    // Normal selection behavior
    if (currentObject.userData["locked"] !== true && this.control) {
      this.scene.add(this.control);
      this.control.attach(currentObject);
    }

    if (this.selected && this.selectionPass) {
      this.selectionPass.setSelectedObjects(this.selected);
    }
    this.transform_interaction = true;
    // Contact react land — updateSelectedUI emits InspectorPanelChangedEvent
    // with the panel data, which the bridge translates into both
    // updateObjectPanel + showObjectPanel store calls.
    this.updateSelectedUI();
  }

  onMouseDown(event: any) {
    if (
      (event.button === 0 || event.button === 1) &&
      this.isMovable() &&
      !this.isBoneDragged
    ) {
      this.isMouseClicked = true;
      // Pointer lock is requested from `handleMousePointerLock()` once
      // we see a real mousemove with the button held — locking eagerly
      // on mousedown intercepts the browser's click-event pipeline and
      // suppresses static-click selection.
    }
  }

  onMouseUp(event: any) {
    if (event.button === 0 || event.button === 1) {
      // Snapshot the quaternion the user actually ended on. The unlock
      // listener in editor.ts will restore this once Chromium's
      // synthetic-mousemove window has closed, so the camera doesn't
      // lurch by the cursor's trip-home delta.
      if (this.camera) {
        this.quatAtUnlockRequest = this.camera.quaternion.clone();
      }
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
      if (this.deps.getPoseMode() === "pose") {
        this.deps.bus.emit(new PoseModeChangedEvent("select"));
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
    if (this.deps.getPoseMode() === "select") {
      this.deps.bus.emit(new PoseModeChangedEvent("pose"));
    }
    console.log("FK mode on");
    return;
  }

  async onkeydown(event: KeyboardEvent) {
    if (isEventFromEditableElement(event)) {
      return;
    }

    if (this.deps.isHotkeyDisabled()) {
      return;
    } else if (event.key === "f" && this.selected && this.lockControls) {
      this.focus();
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
          this.deps.bus.emit(new PoseControlsVisibilityChangedEvent(false));
        });
      }
      return;
    } else if (event.key === "t") {
      // transform
      this.control?.setMode("translate");
      const ts = this.deps.getTransformSpace();
      if (this.control) this.control.space = ts;
      this.deps.bus.emit(new SelectedModeChangedEvent("move"));
      return;
    } else if (event.key === "x") {
      // toggle world/local space (blocked in scale mode)
      if (this.control?.mode === "scale") return;
      const next: TransformSpace =
        this.deps.getTransformSpace() === "world" ? "local" : "world";
      this.deps.bus.emit(new TransformSpaceChangedEvent(next));
      if (this.control) this.control.space = next;
      return;
    } else if (event.key === "r" && !event.ctrlKey) {
      // rotate
      this.control?.setMode("rotate");
      if (this.control) this.control.space = this.deps.getTransformSpace();
      this.deps.bus.emit(new SelectedModeChangedEvent("rotate"));
      return;
    } else if (event.key === "g") {
      // scale
      this.control?.setMode("scale");
      if (this.control) this.control.space = this.deps.getTransformSpace();
      this.deps.bus.emit(new SelectedModeChangedEvent("scale"));
      return;
    } else if (event.key === "k") {
      this.toggleFKMode();
      return;
    } else if (event.key === "b") {
      // Open asset modal
      this.deps.bus.emit(new AssetModalVisibilityChangedEvent(true, true));
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !this.isProcessing) {
      const keyLower = event.key.toLowerCase();
      if (keyLower === "z" && !event.shiftKey) {
        // undo
        event.preventDefault();
        this.isProcessing = true;
        try {
          await this.sceneManager?.undo();
        } finally {
          this.isProcessing = false;
        }
      } else if (keyLower === "z" && event.shiftKey) {
        // redo (Ctrl+Shift+Z / Cmd+Shift+Z)
        event.preventDefault();
        this.isProcessing = true;
        try {
          await this.sceneManager?.redo();
        } finally {
          this.isProcessing = false;
        }
      } else if (keyLower === "y") {
        // redo (Ctrl+Y on Windows/Linux, Cmd+Y on macOS)
        event.preventDefault();
        this.isProcessing = true;
        try {
          await this.sceneManager?.redo();
        } finally {
          this.isProcessing = false;
        }
      } else if (keyLower === "c") {
        // Copy
        event.preventDefault();
        event.stopPropagation();
        this.isProcessing = true;
        try {
          await this.sceneManager?.copy();
        } finally {
          this.isProcessing = false;
        }
      } else if (keyLower === "v") {
        // Paste
        event.preventDefault();
        event.stopPropagation();
        this.isProcessing = true;
        try {
          await this.sceneManager?.paste();
        } finally {
          this.isProcessing = false;
        }
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

    if (this.cameraViewControls) {
      if (event.shiftKey) {
        this.cameraViewControls.movementSpeed = 3;
      } else if (event.altKey) {
        this.cameraViewControls.movementSpeed = 0.1;
      } else {
        this.cameraViewControls.movementSpeed = 0.75;
      }
    }

    if (event.key === "Escape") {
      if (this.deps.getPoseMode() === "pose") {
        this.toggleFKMode();
        return;
      } else if (this.selected && this.selected.length > 0) {
        this.removeTransformControls();
        this.deps.bus.emit(new InspectorPanelChangedEvent(null));
        this.deps.bus.emit(new PoseControlsVisibilityChangedEvent(false));
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
      this.selectionPass == undefined ||
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
      this.deps.bus.emit(new InspectorPanelChangedEvent(null));
      this.deps.bus.emit(new PoseControlsVisibilityChangedEvent(false));
    }

    if (this.sceneManager) {
      const selected: SceneObject | null = this.sceneManager.selected();
      this.deps.bus.emit(new OutlinerSelectedItemChangedEvent(selected));
    }
  }
}
