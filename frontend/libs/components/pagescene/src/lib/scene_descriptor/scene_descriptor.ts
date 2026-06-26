// Universal Scene Descriptor — a compact, LLM-friendly projection of the
// live 3D scene.
//
// This is the editable interchange format for the experimental
// "scene enhancement" feature: we export the PageScene into a descriptor,
// let a human (or, later, an LLM) edit it, then apply it back to update
// the scene. It is intentionally a *lossy view* of the heavy internal
// `ObjectJSON` — only the spatial/semantic fields a model can reason
// about are surfaced at the top level. Everything needed for a lossless
// round-trip that the editor shouldn't have to think about (asset tokens,
// material params, mixamo rig pose tree) rides along in `source`.
//
// Gray-box mode: textures are not represented. Entities carry an optional
// flat `color`; anything without one renders flat-gray shaded. An LLM is
// free to add primitives and recolor without ever touching texture data.

import { ObjectJSON } from "../proxy/storyteller_proxy_3d_object";

// Bumped when the descriptor shape changes in a non-backward-compatible
// way. `applySceneDescriptor` reads it to decide how to interpret input.
export const SCENE_DESCRIPTOR_VERSION = 1;

// Default flat-gray for entities that don't specify a color (gray-box).
export const GRAY_BOX_COLOR = "#9a9a9a";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// What kind of thing an entity is. Drives how `applySceneDescriptor`
// reconstructs it when no `source` is present (e.g. an LLM-authored
// addition). Only `primitive` can be synthesized from scratch today —
// models/characters need their original asset token, carried in `source`.
export type DescriptorEntityKind =
  | "primitive"
  | "model"
  | "character"
  | "light"
  | "image"
  | "point"
  | "unknown";

export interface DescriptorTransform {
  // World-space, Y-up, right-handed (three.js convention).
  position: Vec3;
  // Euler XYZ in DEGREES — friendlier for hand/LLM editing than radians.
  rotationDeg: Vec3;
  scale: Vec3;
}

// One object in the scene. The top-level fields are the editable surface;
// `source` is the lossless passthrough an editor shouldn't touch.
export interface DescriptorEntity {
  // Stable identity across a round-trip (the object's uuid). Keep it on
  // edits so the apply step updates-in-place; omit it on a brand-new
  // entity and the apply step mints a fresh id.
  id: string;
  name: string;
  kind: DescriptorEntityKind;

  // Primitive geometry key ("Box", "Sphere", "Cone", "Cylinder",
  // "Donut", "PointLight", "Water"). Only meaningful for `primitive`.
  shape?: string;

  // Flat hex color, e.g. "#9a9a9a". Absent ⇒ gray-box default.
  color?: string;
  visible?: boolean;

  transform: DescriptorTransform;

  // True when this entity carries a mixamo rig pose (in `source.rigData`).
  // Per-bone pose editing through the descriptor is a follow-up; for now
  // the pose round-trips losslessly via `source` and this flag advertises
  // its presence to a reader.
  hasPose?: boolean;

  // Lossless round-trip passthrough. NOT intended for hand/LLM editing.
  // When an entity omits it (a new primitive), `applySceneDescriptor`
  // synthesizes the underlying object from the editable fields above.
  source?: ObjectJSON;
}

// Read-only spatial context for whoever edits the descriptor. Not applied
// back to the scene (camera framing is out of scope for milestone 1).
export interface DescriptorCamera {
  position: Vec3;
  rotationDeg: Vec3;
}

export interface DescriptorEnvironment {
  // Skybox media token, preserved verbatim across a round-trip.
  skybox?: string;
}

export interface SceneDescriptor {
  descriptorVersion: number;
  // Human/LLM-facing note describing conventions, regenerated on export.
  units: "meters";
  coordinateSystem: "y-up-right-handed";
  environment: DescriptorEnvironment;
  camera?: DescriptorCamera;
  entities: DescriptorEntity[];
}
