// Owns the TransformControls gizmo used for translating/rotating/scaling
// the selected object. Construction is two-phase to match the existing
// editor lifecycle: the controller is created up front (held as a field
// on Editor), then `configure()` wires it to the camera/renderer once
// initialize() has produced them.
//
// Store access for the transform-space pref is injected via Deps so the
// controller doesn't import the Zustand store directly.

import type * as THREE from "three";
import { TransformControls } from "../TransformControls.js";

export type TransformMode = "translate" | "rotate" | "scale";
export type TransformSpace = "world" | "local";

export type GizmoCallbacks = {
  // Fires on every internal TransformControls "change" event — Editor
  // uses this to re-render the scene during a drag.
  onChange: () => void;
  // Fires when a drag starts or ends. `dragging` is true on drag start.
  onDraggingChanged: (dragging: boolean) => void;
};

// Capabilities the gizmo needs from outside its own state.
// Editor wires these in initialize() so GizmoController never imports
// the store directly.
export type GizmoControllerDeps = {
  getTransformSpace: () => TransformSpace;
  setTransformSpace: (space: TransformSpace) => void;
};

export class GizmoController {
  control: TransformControls | undefined;

  private deps: GizmoControllerDeps;

  constructor(deps: GizmoControllerDeps) {
    this.deps = deps;
  }

  configure(
    camera: THREE.PerspectiveCamera | null,
    domElement: HTMLElement,
    scene: THREE.Scene,
    callbacks: GizmoCallbacks,
  ) {
    if (camera == undefined) return;
    this.control = new TransformControls(camera, domElement);
    this.control.space = "world";
    this.control.setScaleSnap(0.01);
    this.control.setTranslationSnap(0.01);
    this.control.setRotationSnap(0.01);
    this.control.setSize(0.5);
    this.control.addEventListener("change", callbacks.onChange);
    this.control.addEventListener("dragging-changed", (event: any) => {
      callbacks.onDraggingChanged(event.value);
    });
    scene.add(this.control);
  }

  // Apply a transform mode. Reads the desired space from the store so
  // callers don't need to plumb it through. Scale is always local.
  changeMode(type: TransformMode) {
    if (this.control == undefined) return;
    const space = type === "scale" ? "local" : this.deps.getTransformSpace();
    this.control.mode = type;
    this.control.space = space;
  }

  setSpace(space: TransformSpace) {
    if (this.control == undefined) return;
    this.control.space = space;
  }

  // Flip the store's transform-space preference and push the new value
  // into the live gizmo. No-op when the gizmo is in scale mode (scale
  // is always local).
  toggleTransformSpace() {
    if (!this.canToggleSpace()) return;
    const next =
      this.deps.getTransformSpace() === "world" ? "local" : "world";
    this.deps.setTransformSpace(next);
    this.setSpace(next);
  }

  // True when the gizmo exists and is in a mode where toggling between
  // world/local space is meaningful (scale is always local).
  canToggleSpace(): boolean {
    return this.control != undefined && this.control.mode !== "scale";
  }

  attach(object: THREE.Object3D) {
    this.control?.attach(object);
  }

  detach() {
    this.control?.detach();
  }

  // Add/remove the gizmo from the scene. Used by SceneUtils when
  // locking/unlocking objects: the gizmo is yanked out of the scene on
  // lock and re-added on unlock.
  addToScene(scene: THREE.Scene) {
    if (this.control) scene.add(this.control);
  }

  removeFromScene(scene: THREE.Scene) {
    if (this.control) scene.remove(this.control);
  }

  setVisible(visible: boolean) {
    if (this.control) this.control.visible = visible;
  }

  isVisible(): boolean {
    return this.control?.visible ?? false;
  }
}
