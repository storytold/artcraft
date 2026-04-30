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
import { AssetType, ClipGroup } from "~/enums";
import { usePageSceneStore } from "../../PageSceneStore";
import type { SceneManager } from "../scene_manager_api";

export type SelectionEngineRefs = {
  // Lazy: SceneManager is created in Editor.initialize, after the bridge.
  getSceneManager: () => SceneManager | undefined;
  // The reserved camera-entity name ("::CAM::") used to distinguish
  // ClipGroup.CAMERA / AssetType.CAMERA from regular meshes.
  cameraName: string;
  // Editor's data version, written into the object panel.
  version: number;
};

export class SelectionBridge {
  // The currently inspected object. Read by ControlPanelSceneObject via
  // a forwarding getter on Editor (`editor.selected`).
  selected: THREE.Object3D | undefined;

  // Frame-to-frame "did the selection's transform change" check —
  // compared in renderSingleFrame against utils.getSelectedSum().
  last_selected_sum: number = 0;

  constructor(private readonly engine: SelectionEngineRefs) {}

  setSelected(object: THREE.Object3D[] | undefined) {
    const sceneManager = this.engine.getSceneManager();
    if (sceneManager) sceneManager.selected_objects = object;
  }

  // Push the current selection (or null) into the store. Drives the
  // global "what's selected?" state used by toolbars, panels, etc.
  publishSelect() {
    const target = this.engine.getSceneManager()?.selected_objects?.[0];
    const store = usePageSceneStore.getState();
    if (target) {
      store.setSelectedObject({
        type: this.getAssetType(target),
        id: target.uuid,
      });
    } else {
      store.setSelectedObject(null);
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

    usePageSceneStore.getState().updateObjectPanel({
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
    });
  }

  // Recompute outliner rows and push them into the store. Replaces the
  // four near-identical copies of this snippet that used to live in
  // Editor.initialize, newScene, loadScene, and deleteObject.
  refreshOutliner() {
    const result = this.engine
      .getSceneManager()
      ?.render_outliner(this.getCharactersByUuid());
    if (result) usePageSceneStore.getState().setOutlinerItems(result.items);
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
  // render as characters.
  getCharactersByUuid(): { [uuid: string]: ClipGroup } {
    const characters = usePageSceneStore.getState().characters;
    const result: { [uuid: string]: ClipGroup } = {};
    for (const c of characters) {
      result[c.id] = ClipGroup.CHARACTER;
    }
    return result;
  }

  // Replaces the deleted Timeline.isCharacter — checks the Zustand
  // store's character list, which is the source of truth for which
  // scene objects are characters.
  isCharacterUuid(uuid: string): boolean {
    return usePageSceneStore.getState().characters.some((c) => c.id === uuid);
  }
}
