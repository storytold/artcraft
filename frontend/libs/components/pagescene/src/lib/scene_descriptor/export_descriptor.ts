// Export: live PageScene → SceneDescriptor.
//
// We lean on the existing serialization machinery (StoryTellerProxyScene)
// to snapshot the scene into ObjectJSON[], then project each object into
// the compact, editable descriptor entity while stashing the full
// ObjectJSON in `source` for a lossless round-trip.

import * as THREE from "three";
import type Editor from "../engine/editor";
import { StoryTellerProxyScene } from "../proxy/storyteller_proxy_scene";
import { ObjectJSON } from "../proxy/storyteller_proxy_3d_object";
import {
  DescriptorCamera,
  DescriptorEntity,
  DescriptorEntityKind,
  SceneDescriptor,
  SCENE_DESCRIPTOR_VERSION,
  Vec3,
} from "./scene_descriptor";

export function buildSceneDescriptor(editor: Editor): SceneDescriptor {
  const scene = editor.activeScene;
  const proxy = new StoryTellerProxyScene(editor.version, scene);
  const objects = proxy.saveToScene(editor.version);

  const entities = objects.map(objectJsonToEntity);

  return {
    descriptorVersion: SCENE_DESCRIPTOR_VERSION,
    units: "meters",
    coordinateSystem: "y-up-right-handed",
    environment: { skybox: scene.skybox || undefined },
    camera: readCamera(editor),
    entities,
  };
}

function objectJsonToEntity(obj: ObjectJSON): DescriptorEntity {
  const kind = classifyKind(obj);
  const entity: DescriptorEntity = {
    id: obj.object_uuid,
    name: obj.object_user_data_name || obj.object_name || "",
    kind,
    color: obj.color || undefined,
    visible: obj.visible !== false,
    transform: {
      position: radSafeVec(obj.position),
      rotationDeg: eulerRadToDeg(obj.rotation),
      scale: radSafeVec(obj.scale),
    },
    source: obj,
  };

  if (kind === "primitive") {
    entity.shape =
      (obj.user_data?.shapeType as string | undefined) ??
      (obj.user_data?.shapeKey as string | undefined) ??
      obj.object_name;
  }
  if (obj.rigData) {
    entity.hasPose = true;
  }
  return entity;
}

// Mirror of the token dispatch in StoryTellerProxyScene.loadFromSceneJson:
// the media_file_token is the discriminator the loader switches on.
function classifyKind(obj: ObjectJSON): DescriptorEntityKind {
  const token = obj.media_file_token ?? "";
  if (token === "Parim" || obj.user_data?.isShape === true) return "primitive";
  if (token === "DirectionalLight") return "light";
  if (token.includes("Point::")) return "point";
  if (token.includes("Image::")) return "image";
  if (token.includes("m_")) {
    return obj.user_data?.isCharacter === true ? "character" : "model";
  }
  return "unknown";
}

function readCamera(editor: Editor): DescriptorCamera | undefined {
  const cam = editor.cameraController?.camera;
  if (!cam) return undefined;
  return {
    position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
    rotationDeg: eulerRadToDeg(cam.rotation),
  };
}

function eulerRadToDeg(r: { x: number; y: number; z: number }): Vec3 {
  return {
    x: round(THREE.MathUtils.radToDeg(r.x)),
    y: round(THREE.MathUtils.radToDeg(r.y)),
    z: round(THREE.MathUtils.radToDeg(r.z)),
  };
}

function radSafeVec(v: { x: number; y: number; z: number }): Vec3 {
  return { x: round(v.x), y: round(v.y), z: round(v.z) };
}

// Trim float noise so the exported JSON reads cleanly. 5 decimals keeps
// sub-millimeter precision while dropping 1e-16 dust from THREE math.
function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e5) / 1e5;
}
