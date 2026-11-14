import * as THREE from "three";
import type Editor from "../editor";
import { TransformAction } from "./actions/TransformAction";
import { usePageSceneStore } from "../../PageSceneStore";

// Blender-style modal transform. Press the grab key (G in the Blender preset) to
// start moving the selection with the mouse — no gizmo handle needed. While
// active:
//   • move the mouse to drag on a camera-facing plane,
//   • press X / Y / Z to constrain to that world axis (Shift+axis to EXCLUDE it),
//   • left-click or Enter to confirm, Esc or right-click to cancel.
//
// v1 supports translate. The controller owns capture-phase document listeners
// while active and flips `modalTransformActive` in the store so free-cam and the
// normal keymap stand down. Confirm records a single TransformAction (undoable);
// cancel restores the start position and records nothing.
export class ModalTransformController {
  private readonly editor: Editor;
  private readonly raycaster = new THREE.Raycaster();
  private readonly plane = new THREE.Plane();

  private active = false;
  private target: THREE.Object3D | null = null;
  private action: TransformAction | null = null;
  private readonly startPos = new THREE.Vector3();
  private readonly startPoint = new THREE.Vector3();
  private readonly lastPoint = new THREE.Vector3();
  private hasStart = false;
  private axis: "x" | "y" | "z" | null = null;
  private exclude = false;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  isActive(): boolean {
    return this.active;
  }

  begin(_mode: "translate") {
    if (this.active) return;
    const target = this.editor.sceneManager?.selected_objects?.[0];
    const camera = this.editor.cameraController.camera;
    const dom = this.editor.renderer?.domElement;
    if (!target || !camera || !dom) return;

    this.target = target;
    this.startPos.copy(target.position);
    this.action = new TransformAction(this.editor, target.uuid);

    // Drag plane: faces the camera, passes through the object.
    const normal = new THREE.Vector3();
    camera.getWorldDirection(normal);
    this.plane.setFromNormalAndCoplanarPoint(normal, target.position);

    this.axis = null;
    this.exclude = false;
    this.hasStart = false;

    this.active = true;
    this.editor.gizmo.detach();
    usePageSceneStore.getState().setModalTransformActive(true);

    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerdown", this.onPointerDown, true);
    document.addEventListener("keydown", this.onKeyDown, true);
    document.addEventListener("contextmenu", this.onContextMenu, true);
  }

  // ── pointer ────────────────────────────────────────────────────────────────

  private onPointerMove = (e: PointerEvent) => {
    const camera = this.editor.cameraController.camera;
    if (!this.active || !this.target || !camera) return;
    const point = this.projectCursor(e.clientX, e.clientY, camera);
    if (!point) return;
    this.lastPoint.copy(point);
    // First move after begin establishes the reference point (delta = 0).
    if (!this.hasStart) {
      this.startPoint.copy(point);
      this.hasStart = true;
      return;
    }
    this.apply();
  };

  private onPointerDown = (e: PointerEvent) => {
    if (!this.active) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 2) this.cancel();
    else this.commit();
  };

  private onContextMenu = (e: Event) => {
    if (!this.active) return;
    e.preventDefault();
    e.stopPropagation();
  };

  // ── keyboard ─────────────────────────────────────────────────────────────

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.active) return;
    switch (e.code) {
      case "KeyX":
      case "KeyY":
      case "KeyZ": {
        const axis = e.code === "KeyX" ? "x" : e.code === "KeyY" ? "y" : "z";
        // Pressing the same axis again with no shift toggles the constraint off.
        if (this.axis === axis && this.exclude === e.shiftKey) {
          this.axis = null;
          this.exclude = false;
        } else {
          this.axis = axis;
          this.exclude = e.shiftKey;
        }
        e.preventDefault();
        e.stopPropagation();
        this.apply();
        break;
      }
      case "Enter":
      case "NumpadEnter":
        e.preventDefault();
        e.stopPropagation();
        this.commit();
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        this.cancel();
        break;
    }
  };

  // ── math ───────────────────────────────────────────────────────────────────

  private apply() {
    if (!this.target || !this.hasStart) return;
    const delta = this.lastPoint.clone().sub(this.startPoint);
    if (this.axis) {
      const axisVec = this.axisVector(this.axis);
      const along = delta.dot(axisVec);
      if (this.exclude) {
        // Lock to the plane of the other two axes: drop the axis component.
        delta.addScaledVector(axisVec, -along);
      } else {
        // Constrain to the single axis.
        delta.copy(axisVec).multiplyScalar(along);
      }
    }
    this.target.position.copy(this.startPos).add(delta);
    this.editor.renderScene();
  }

  private axisVector(axis: "x" | "y" | "z"): THREE.Vector3 {
    if (axis === "x") return new THREE.Vector3(1, 0, 0);
    if (axis === "y") return new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3(0, 0, 1);
  }

  private projectCursor(
    clientX: number,
    clientY: number,
    camera: THREE.PerspectiveCamera,
  ): THREE.Vector3 | null {
    const dom = this.editor.renderer?.domElement;
    if (!dom) return null;
    const rect = dom.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.plane, hit) ? hit : null;
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  private commit() {
    if (this.action && this.action.commit()) {
      this.editor.history.record(this.action);
    }
    this.editor.selection.updateSelectedUI();
    this.cleanup();
  }

  private cancel() {
    if (this.target) this.target.position.copy(this.startPos);
    this.editor.renderScene();
    this.cleanup();
  }

  private cleanup() {
    this.active = false;
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerdown", this.onPointerDown, true);
    document.removeEventListener("keydown", this.onKeyDown, true);
    document.removeEventListener("contextmenu", this.onContextMenu, true);
    usePageSceneStore.getState().setModalTransformActive(false);

    // Re-attach the gizmo to the (still-selected) object.
    const sel = this.editor.sceneManager?.selected_objects?.[0];
    this.editor.gizmo.addToScene(this.editor.activeScene.scene);
    if (sel) this.editor.gizmo.attach(sel);

    this.target = null;
    this.action = null;
    this.hasStart = false;
    this.axis = null;
    this.exclude = false;
  }
}
