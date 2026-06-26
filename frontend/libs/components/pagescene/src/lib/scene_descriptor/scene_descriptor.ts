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
//   v1 → initial (transforms, primitives, characters w/ pose)
//   v2 → optional per-object geometry (vertex data) + "mesh" kind
export const SCENE_DESCRIPTOR_VERSION = 2;

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
  | "mesh"
  | "instances"
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

  // Raw per-object vertex data. Defines a `mesh` entity outright; on other
  // kinds it's an optional snapshot included only when geometry export is
  // requested (it can be large). See DescriptorGeometry.
  geometry?: DescriptorGeometry;

  // Instancing spec — defines an `instances` entity (one InstancedMesh for
  // a whole forest / grass field). See DescriptorInstancing.
  instancing?: DescriptorInstancing;

  // Custom shader material applied to this entity's meshes (any kind).
  // The LLM-authored "custom mat" path. See ShaderMaterialSpec.
  material?: ShaderMaterialSpec;

  // Flat hex color, e.g. "#9a9a9a". Absent ⇒ gray-box default.
  color?: string;
  visible?: boolean;

  transform: DescriptorTransform;

  // Editable mixamo pose: per-bone LOCAL rotation. Present on characters.
  // Bones omitted here keep whatever the rig fallback (`source.rigData`)
  // restores, so an editor can touch just the bones it cares about.
  pose?: DescriptorPose;

  // True when this entity carries a mixamo rig (so a reader knows a pose
  // exists even if `pose` couldn't be decoded for some bones).
  hasPose?: boolean;

  // Lossless round-trip passthrough. NOT intended for hand/LLM editing.
  // When an entity omits it (a new primitive), `applySceneDescriptor`
  // synthesizes the underlying object from the editable fields above.
  source?: ObjectJSON;
}

// Raw per-object vertex data — the "potentially much larger" payload.
// Non-indexed triangle soup in the object's LOCAL space: every 3 vertices
// (9 numbers) form one triangle. Normals are recomputed on import, so
// they aren't stored. Textures/UVs are omitted (gray-box).
export interface DescriptorGeometry {
  // Flat positions [x,y,z, x,y,z, ...]. Length is a multiple of 9.
  positions: number[];
  // Convenience mirror of positions.length / 3 (informational).
  vertexCount?: number;
}

// ── Instancing (trees / grass) ──────────────────────────────────────────

// Base geometry every instance shares. Pick ONE:
//  - shape:     a built-in primitive key ("Cone", "Cylinder", "Box", …)
//  - positions: custom low-vertex geometry (e.g. a grass blade), local space
//  - plane:     a flat quad (billboard-style card)
export interface InstancingBase {
  shape?: string;
  positions?: number[];
  plane?: { width: number; height: number };
}

// One placed instance (local to the field origin = the entity transform).
export interface InstanceTransform {
  position: Vec3;
  rotationDeg: Vec3;
  scale: Vec3;
  color?: string;
}

// Procedural placement — far cheaper for an LLM to emit than N explicit
// instances. Deterministic given `seed`. Expanded to instances on apply.
export interface InstancingScatter {
  count: number;
  area: { x: number; z: number }; // spread, centered on the field origin
  seed?: number;
  yJitterDeg?: number; // random yaw range, default 360
  scaleRange?: [number, number]; // uniform scale range, default [1,1]
}

export interface DescriptorInstancing {
  base: InstancingBase;
  // Provide explicit instances OR a scatter spec (scatter wins if both).
  instances?: InstanceTransform[];
  scatter?: InstancingScatter;
}

// ── Custom shader material (LLM-authored) ───────────────────────────────

// A custom GLSL material. `fragmentShader` is required; a default vertex
// shader (exposing vUv/vNormal/vPosition) and `time`/`resolution` uniforms
// are injected, so a bare fragment shader works. `uniforms` values are
// numbers or 2/3/4-length arrays (→ vec2/3/4).
export interface ShaderMaterialSpec {
  type?: "shader";
  fragmentShader: string;
  vertexShader?: string;
  uniforms?: Record<string, number | number[]>;
  transparent?: boolean;
  doubleSide?: boolean;
  animated?: boolean; // tick the injected `time` uniform each frame
}

// One bone's editable local transform. Rotation only for now — that's
// what FK posing manipulates; bone translation/scale are rarely posed.
export interface BonePose {
  // Local Euler XYZ in DEGREES.
  rotationDeg: Vec3;
}

// A character's editable pose: a flat map of bone name → local rotation,
// anchored on the mixamo root bone (e.g. "mixamorigHips"). Compact and
// hand/LLM-editable, unlike the opaque matrix tree in `source.rigData`.
export interface DescriptorPose {
  rootBone: string;
  // Local position of the root bone (hip translation), if meaningful.
  rootPosition?: Vec3;
  bones: Record<string, BonePose>;
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
