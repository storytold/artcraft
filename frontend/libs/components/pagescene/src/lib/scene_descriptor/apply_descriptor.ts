// Apply: SceneDescriptor → live PageScene, by in-place reconciliation.
//
// Rather than tearing down and rebuilding the scene (which reloads every
// mesh over the network), we reconcile the descriptor against the objects
// already in the scene, keyed by id:
//
//   - id matches an existing object  → update it in place (transform,
//     color, visibility, mixamo pose). No reload.
//   - primitive with no match        → instantiate locally (no network).
//   - model/character with no match  → skipped (creating new rigged assets
//     from text is out of scope for the test phase).
//   - existing object absent from    → removed.
//     the descriptor
//
// The whole reconciliation is recorded as ONE undoable history entry, so a
// single undo reverts the entire apply at once.

import * as THREE from "three";
import type Editor from "../engine/editor";
import type Scene from "../engine/scene";
import { MediaFileType } from "../enums";
import { isInternalBbox } from "../engine/internalBbox";
import { BoneJSONHelper } from "../engine/KinHelpers/BoneJSONHelper";
import { getSceneGenerationMetaData } from "../sceneMetadata";
import { ApplyDescriptorAction } from "./apply_action";
import { applyPose } from "./pose_codec";
import { resolveInstancing } from "./instancing_codec";
import {
  DescriptorEntity,
  GRAY_BOX_COLOR,
  SceneDescriptor,
} from "./scene_descriptor";

export interface ApplyResult {
  applied: number;
  skipped: number;
  removed: number;
  // Whether the apply changed the scene (and was recorded as one
  // undoable history entry).
  recorded: boolean;
}

export async function applySceneDescriptor(
  editor: Editor,
  descriptor: SceneDescriptor,
): Promise<ApplyResult> {
  const entities = descriptor?.entities ?? [];
  const scene = editor.activeScene;

  // Undo target — full scene snapshot before we touch anything.
  const before = snapshotSceneJson(editor);

  const existing = indexExistingObjects(scene);
  const seen = new Set<string>();
  let applied = 0;
  let skipped = 0;

  for (const entity of entities) {
    let obj = entity.id ? existing.get(entity.id) : undefined;

    // A primitive whose shape changed can't swap geometry in place —
    // drop it and recreate below.
    if (obj && entity.kind === "primitive" && shapeChanged(obj, entity)) {
      editor.utils.deleteObject(obj.uuid);
      existing.delete(entity.id);
      obj = undefined;
    }

    if (obj) {
      updateObjectInPlace(scene, obj, entity);
      seen.add(entity.id);
      applied++;
    } else if (entity.kind === "primitive" && entity.shape) {
      const created = await createPrimitive(scene, entity);
      if (created) {
        seen.add(created.uuid);
        applied++;
      } else {
        skipped++;
      }
    } else if (entity.kind === "mesh") {
      const created = await createMesh(scene, entity);
      if (created) {
        seen.add(created.uuid);
        applied++;
      } else {
        skipped++;
      }
    } else if (entity.kind === "instances") {
      const created = await createInstances(scene, entity);
      if (created) {
        seen.add(created.uuid);
        applied++;
      } else {
        skipped++;
      }
    } else {
      // New model/character: not supported in the test phase (would
      // require loading an asset we can't synthesize from text).
      skipped++;
    }
  }

  // Remove objects the descriptor dropped.
  let removed = 0;
  for (const uuid of existing.keys()) {
    if (!seen.has(uuid)) {
      editor.utils.deleteObject(uuid);
      removed++;
    }
  }

  // Environment + a frame so the result is visible immediately.
  const skybox = descriptor?.environment?.skybox;
  if (skybox) scene.updateSkybox(skybox);
  editor.renderScene();

  const after = snapshotSceneJson(editor);
  const recorded = before !== after;
  if (recorded) {
    editor.history.record(new ApplyDescriptorAction(editor, before, after));
  }
  return { applied, skipped, removed, recorded };
}

// Index the scene's real, top-level objects by uuid. Mirrors the filter
// the serializer uses (media_id present, not an internal bbox helper).
function indexExistingObjects(scene: Scene): Map<string, THREE.Object3D> {
  const map = new Map<string, THREE.Object3D>();
  for (const child of scene.scene?.children ?? []) {
    if (isInternalBbox(child)) continue;
    if (child.userData?.["media_id"] == null) continue;
    map.set(child.uuid, child);
  }
  return map;
}

// Update an existing object from an entity — no reload. Transform, name,
// visibility, color, and (for characters) mixamo pose.
function updateObjectInPlace(
  scene: Scene,
  obj: THREE.Object3D,
  entity: DescriptorEntity,
): void {
  const t = entity.transform;
  if (t) {
    if (t.position) obj.position.set(t.position.x, t.position.y, t.position.z);
    if (t.rotationDeg) {
      obj.rotation.set(
        THREE.MathUtils.degToRad(t.rotationDeg.x ?? 0),
        THREE.MathUtils.degToRad(t.rotationDeg.y ?? 0),
        THREE.MathUtils.degToRad(t.rotationDeg.z ?? 0),
      );
    }
    if (t.scale) obj.scale.set(t.scale.x ?? 1, t.scale.y ?? 1, t.scale.z ?? 1);
  }

  if (entity.name) {
    obj.name = entity.name;
    obj.userData["name"] = entity.name;
  }
  if (entity.visible !== undefined) scene.setVisible(obj.uuid, entity.visible);
  if (entity.color) scene.setColor(obj.uuid, entity.color);

  if (entity.kind === "character") {
    if (entity.pose) {
      applyPose(obj, entity.pose);
    } else if (entity.source?.rigData) {
      // No edited pose — restore the lossless rig fallback.
      new BoneJSONHelper(obj).poseFromBoneJSON(entity.source.rigData);
    }
  }

  // Custom (LLM-authored) shader material — applies to any kind, after
  // setColor so it isn't clobbered.
  if (entity.material?.fragmentShader) {
    scene.applyShaderMaterial(obj.uuid, entity.material);
  }
}

// Instantiate a primitive locally (no network) and stamp the userData the
// serializer + loader expect, then apply the entity's editable fields.
async function createPrimitive(
  scene: Scene,
  entity: DescriptorEntity,
): Promise<THREE.Object3D | undefined> {
  const shape = entity.shape;
  if (!shape) return undefined;

  const created = await scene.instantiate(shape);
  const obj = scene.get_object_by_uuid(created.uuid);
  if (!obj) return undefined;

  // Adopt the descriptor's stable id so later applies match in place.
  if (entity.id) obj.uuid = entity.id;

  obj.userData["media_id"] = "Parim";
  obj.userData["isShape"] = true;
  obj.userData["shapeKey"] = shape;
  obj.userData["shapeType"] = shape;
  obj.userData["media_file_type"] = MediaFileType.None;
  obj.userData["color"] = entity.color || GRAY_BOX_COLOR;
  obj.userData["metalness"] = 0;
  obj.userData["shininess"] = 0.5;
  obj.userData["specular"] = 0.5;
  obj.userData["locked"] = false;

  updateObjectInPlace(scene, obj, entity);
  return obj;
}

// Reconstruct a geometry-backed mesh from the entity's raw vertex data
// (no asset reload — the vertices are self-contained). Used for `mesh`
// entities with no existing match.
async function createMesh(
  scene: Scene,
  entity: DescriptorEntity,
): Promise<THREE.Object3D | undefined> {
  const positions =
    entity.geometry?.positions ?? entity.source?.geometry?.positions;
  if (!positions || positions.length === 0) return undefined;

  const created = await scene.instantiateMeshFromPositions(
    positions,
    entity.color || GRAY_BOX_COLOR,
  );
  const obj = scene.get_object_by_uuid(created.uuid);
  if (!obj) return undefined;

  // Adopt the descriptor's stable id so later applies match in place.
  if (entity.id) {
    obj.uuid = entity.id;
    obj.userData["media_id"] = "Mesh::" + entity.id;
  }
  updateObjectInPlace(scene, obj, entity);
  return obj;
}

// Reconstruct an instanced field (trees/grass) from the entity's
// instancing spec. Scatter specs are expanded deterministically first.
async function createInstances(
  scene: Scene,
  entity: DescriptorEntity,
): Promise<THREE.Object3D | undefined> {
  const resolved = resolveInstancing(entity.instancing);
  if (!resolved?.base) return undefined;

  const created = await scene.instantiateInstancedMesh(
    resolved,
    entity.color || GRAY_BOX_COLOR,
  );
  const obj = scene.get_object_by_uuid(created.uuid);
  if (!obj) return undefined;

  if (entity.id) {
    obj.uuid = entity.id;
    obj.userData["media_id"] = "Instanced::" + entity.id;
  }
  updateObjectInPlace(scene, obj, entity);
  return obj;
}

function shapeChanged(obj: THREE.Object3D, entity: DescriptorEntity): boolean {
  const current =
    (obj.userData?.["shapeKey"] as string | undefined) ??
    (obj.userData?.["shapeType"] as string | undefined);
  return !!entity.shape && !!current && entity.shape !== current;
}

// Full-scene snapshot in the JSON form SaveManager.getSceneJson emits
// (the same shape the load path consumes), stringified. Used as the
// before/after targets for the single undoable history entry.
function snapshotSceneJson(editor: Editor): string {
  return JSON.stringify(
    editor.save_manager.getSceneJson({
      sceneGenerationMetadata: getSceneGenerationMetaData(editor),
    }),
  );
}
