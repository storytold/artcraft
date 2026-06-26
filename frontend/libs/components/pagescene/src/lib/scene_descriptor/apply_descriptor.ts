// Apply: SceneDescriptor → live PageScene.
//
// We translate the descriptor back into the ObjectJSON[] the editor's
// existing load path already understands, then hand it to
// editor.applyJson (which clears the undo stack and rebuilds the scene).
// Existing entities are reconstructed from their lossless `source`;
// entities the editor never saw (e.g. an LLM-authored primitive) are
// synthesized from the editable fields.

import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import type Editor from "../engine/editor";
import { ObjectJSON } from "../proxy/storyteller_proxy_3d_object";
import { MediaFileType } from "../enums";
import {
  DescriptorEntity,
  GRAY_BOX_COLOR,
  SceneDescriptor,
  Vec3,
} from "./scene_descriptor";

export interface ApplyResult {
  applied: number;
  skipped: number;
}

export async function applySceneDescriptor(
  editor: Editor,
  descriptor: SceneDescriptor,
): Promise<ApplyResult> {
  const entities = descriptor?.entities ?? [];
  let skipped = 0;

  const sceneJson: ObjectJSON[] = [];
  for (const entity of entities) {
    const obj = entityToObjectJson(entity, editor.version);
    if (obj) {
      sceneJson.push(obj);
    } else {
      skipped++;
    }
  }

  const wrapper = {
    version: editor.version,
    scene: sceneJson,
    skybox: descriptor?.environment?.skybox ?? editor.activeScene.skybox ?? "",
  };

  await editor.applyJson(JSON.stringify(wrapper));
  return { applied: sceneJson.length, skipped };
}

// Build an ObjectJSON for a single entity. Returns undefined when the
// entity can't be reconstructed (a new model/character with no `source`,
// since the asset token is unknown).
function entityToObjectJson(
  entity: DescriptorEntity,
  version: number,
): ObjectJSON | undefined {
  const base = entity.source
    ? cloneObjectJson(entity.source)
    : synthesize(entity, version);
  if (!base) return undefined;

  // Overlay the editable surface onto the (possibly preserved) base.
  base.object_uuid = entity.id || base.object_uuid || uuidv4();
  if (entity.name) {
    base.object_user_data_name = entity.name;
    base.user_data = { ...base.user_data, name: entity.name };
  }
  if (entity.color) base.color = entity.color;
  if (entity.visible !== undefined) base.visible = entity.visible;

  const t = entity.transform;
  if (t) {
    base.position = vec(t.position);
    base.rotation = eulerDegToRad(t.rotationDeg);
    base.scale = vec(t.scale, 1);
  }

  // A primitive whose shape changed needs the geometry key updated so the
  // loader's instantiate() picks the new geometry on rebuild.
  if (base.media_file_token === "Parim" && entity.shape) {
    base.object_name = entity.shape;
    base.user_data = {
      ...base.user_data,
      shapeKey: entity.shape,
      shapeType: entity.shape,
      isShape: true,
    };
  }

  return base;
}

// Synthesize an ObjectJSON for an entity that has no `source`. Only
// primitives are supported — models/characters require an asset token we
// can't invent.
function synthesize(
  entity: DescriptorEntity,
  version: number,
): ObjectJSON | undefined {
  if (entity.kind !== "primitive" || !entity.shape) return undefined;
  const shape = entity.shape;
  return {
    version,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    object_name: shape,
    object_uuid: entity.id || uuidv4(),
    object_user_data_name: entity.name || shape,
    media_file_token: "Parim",
    color: entity.color || GRAY_BOX_COLOR,
    metalness: 0,
    shininess: 0.5,
    specular: 0.5,
    locked: false,
    visible: entity.visible ?? true,
    rigData: undefined,
    user_data: {
      name: entity.name || shape,
      isShape: true,
      shapeKey: shape,
      shapeType: shape,
      media_file_type: MediaFileType.None,
    },
  };
}

// Deep-clone so we never mutate the descriptor the caller still holds.
function cloneObjectJson(obj: ObjectJSON): ObjectJSON {
  return JSON.parse(JSON.stringify(obj));
}

function vec(v: Vec3 | undefined, fallback = 0): { x: number; y: number; z: number } {
  if (!v) return { x: fallback, y: fallback, z: fallback };
  return { x: v.x ?? fallback, y: v.y ?? fallback, z: v.z ?? fallback };
}

function eulerDegToRad(v: Vec3 | undefined): { x: number; y: number; z: number } {
  if (!v) return { x: 0, y: 0, z: 0 };
  return {
    x: THREE.MathUtils.degToRad(v.x ?? 0),
    y: THREE.MathUtils.degToRad(v.y ?? 0),
    z: THREE.MathUtils.degToRad(v.z ?? 0),
  };
}
