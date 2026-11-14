// Owns the selection-and-outliner sync surface between the Three.js
// SceneManager and the Zustand store: which object is selected, the
// inspector panel ("Object Panel") values for that object, and the
// outliner row list. Centralizes the engine→store writes that were
// previously sprinkled across editor.ts.
//
// SceneManager is forwarded via a closure-based getter (it's constructed
// later in Editor.initialize); cameraName + version are stable values
// passed at construction time. No `editor` reference, no circular import.

import * as THREE from "three";
import { AssetType, ClipGroup } from "../../enums";
import type { SceneManager } from "../scene_manager_api";
import type { EngineEventBus } from "../events/EngineEventBus";
import {
  InspectorPanelChangedEvent,
  OutlinerRefreshedEvent,
  SelectionChangedEvent,
} from "../events/EngineEvent";

export type SelectionBridgeDeps = {
  // Lazy: SceneManager is created in Editor.initialize, after the bridge.
  getSceneManager: () => SceneManager | undefined;
  // The reserved camera-entity name ("::CAM::") used to distinguish
  // ClipGroup.CAMERA / AssetType.CAMERA from regular meshes.
  cameraName: string;
  // Editor's data version, written into the object panel.
  version: number;

  // Lock/unlock plumbing — the userData mutation lives in SceneUtils,
  // and the gizmo attach/detach lives on GizmoController. The bridge
  // calls them through these callbacks instead of importing either.
  toggleObjectLocked: (uuid: string) => boolean; // returns new locked state
  setObjectLocked: (uuid: string, locked: boolean) => void; // direct set (history replay)
  isObjectLocked: (uuid: string) => boolean;
  removeTransformControls: () => void;
  attachGizmoToCurrentSelection: () => void;

  // Typed event bus — every engine→store write goes through here.
  bus: EngineEventBus;
  // Character roster — read from the store at the boundary; the bridge
  // stays store-agnostic.
  getCharactersByUuid: () => { [uuid: string]: ClipGroup };
  isCharacterUuid: (uuid: string) => boolean;
};

export class SelectionBridge {
  // The currently inspected object. Read by ControlPanelSceneObject via
  // a forwarding getter on Editor (`editor.selected`).
  selected: THREE.Object3D | undefined;

  // Frame-to-frame "did the selection's transform change" check —
  // compared in renderSingleFrame against utils.getSelectedSum().
  last_selected_sum: number = 0;

  constructor(private readonly engine: SelectionBridgeDeps) {}

  // Centralized side-effect chain shared by the user-toggle path and
  // history replay. Sets userData.locked, attaches/detaches the gizmo,
  // refreshes the inspector. No recording — the user-facing entry
  // points decide whether to push to the undo stack.
  private applyLockState(object_uuid: string, locked: boolean) {
    this.engine.setObjectLocked(object_uuid, locked);
    if (locked) {
      this.engine.removeTransformControls();
    } else {
      this.engine.attachGizmoToCurrentSelection();
    }
    this.updateSelectedUI();
  }

  // Toggle the locked flag on an object's userData, then either yank
  // the gizmo (lock) or re-attach it to the current selection (unlock).
  // Returns the new locked state. Recording a LockAction is the
  // call site's responsibility — the bridge stays history-agnostic.
  lockUnlockObject(object_uuid: string): boolean {
    const before = this.engine.isObjectLocked(object_uuid);
    const after = !before;
    this.applyLockState(object_uuid, after);
    return after;
  }

  // For history replay: set the locked state directly without recording.
  // Runs the same gizmo attach/detach side effects as lockUnlockObject.
  setLockState(object_uuid: string, locked: boolean) {
    this.applyLockState(object_uuid, locked);
  }

  // True if the object is currently locked. Pure passthrough.
  isObjectLocked(object_uuid: string): boolean {
    return this.engine.isObjectLocked(object_uuid);
  }

  setSelected(object: THREE.Object3D[] | undefined) {
    const sceneManager = this.engine.getSceneManager();
    if (sceneManager) sceneManager.selected_objects = object;
  }

  // Push the current selection (or null) into the store. Drives the
  // global "what's selected?" state used by toolbars, panels, etc.
  publishSelect() {
    const target = this.engine.getSceneManager()?.selected_objects?.[0];
    if (target) {
      this.engine.bus.emit(
        new SelectionChangedEvent({
          type: this.getAssetType(target),
          id: target.uuid,
        }),
      );
    } else {
      this.engine.bus.emit(new SelectionChangedEvent(null));
    }
  }

  // Push the selected object's transform into the inspector panel.
  // No-op if nothing is selected.
  updateSelectedUI() {
    const selected_objects = this.engine.getSceneManager()?.selected_objects;
    if (selected_objects === undefined || selected_objects.length === 0) return;
    const mainSelected = selected_objects[0];
    this.selected = mainSelected;

    const pos = mainSelected.position;
    const rot = mainSelected.rotation;
    const scale = mainSelected.scale;

    this.engine.bus.emit(
      new InspectorPanelChangedEvent({
        // TODO: add metadata to determine whether this is a camera, an
        // object, or a character into prefab clips.
        group:
          mainSelected.name === this.engine.cameraName
            ? ClipGroup.CAMERA
            : ClipGroup.OBJECT,
        object_uuid: mainSelected.uuid,
        object_name: mainSelected.name,
        version: String(this.engine.version),
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
      }),
    );
  }

  // Recompute outliner rows and push them into the store. Replaces the
  // four near-identical copies of this snippet that used to live in
  // Editor.initialize, newScene, loadScene, and deleteObject.
  refreshOutliner() {
    const result = this.engine
      .getSceneManager()
      ?.render_outliner(this.engine.getCharactersByUuid());
    if (result) this.engine.bus.emit(new OutlinerRefreshedEvent(result.items));
  }

  // Refresh outliner and inspector together — used after operations
  // that may have changed both (e.g. an asset finishing loading).
  updateOutliner() {
    this.refreshOutliner();
    this.updateSelectedUI();
  }

  getAssetType(selected: THREE.Object3D): AssetType {
    if (selected.type === "Mesh") {
      return selected.name === this.engine.cameraName
        ? AssetType.CAMERA
        : AssetType.OBJECT;
    }
    return AssetType.CHARACTER;
  }

  // Replaces the deleted Timeline.characters (a Record<uuid, ClipGroup>) —
  // used by SceneManager.render_outliner to know which scene objects to
  // render as characters. The store is read at the boundary (Editor's
  // SelectionBridgeDeps wiring) — the bridge stays store-agnostic.
  getCharactersByUuid(): { [uuid: string]: ClipGroup } {
    return this.engine.getCharactersByUuid();
  }

  // Replaces the deleted Timeline.isCharacter — checks the Zustand
  // store's character list (read via deps callback), which is the
  // source of truth for which scene objects are characters.
  isCharacterUuid(uuid: string): boolean {
    return this.engine.isCharacterUuid(uuid);
  }
}
