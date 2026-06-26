// Per-bone pose codec for mixamo-rigged characters.
//
// The descriptor exposes a character's pose as a flat, editable map of
// bone name → local Euler rotation (degrees) — the same quantity the
// editor's FK tool manipulates (TransformControls in rotate/local mode
// sets a bone's LOCAL rotation). This is the LLM/hand-editable surface;
// the opaque serialized rig tree (`source.rigData`) remains as a lossless
// fallback for bones we don't surface.
//
// We read/write the LIVE three.js skeleton directly rather than decoding
// matrices out of rigData JSON — it's simpler and exact.

import * as THREE from "three";
import { FKBoneBlacklistStrings } from "../engine/KinHelpers/FKBoneFilter";
import { DescriptorPose, Vec3 } from "./scene_descriptor";

// The skeleton root we anchor on (mixamo). Matches BoneJSONHelper.
const ROOT_BONE_HINT = "mixamorighips";

// Read the editable pose off a live character object. Only "posable"
// bones are surfaced — the same filter the FK tool uses, so fingers,
// face, and other fine bones stay in the opaque rig fallback instead of
// bloating the descriptor.
export function extractPose(object: THREE.Object3D): DescriptorPose | undefined {
  const bones = collectBones(object);
  if (bones.length === 0) return undefined;

  const root =
    bones.find((b) => b.name.toLowerCase().includes(ROOT_BONE_HINT)) ??
    bones[0];

  const pose: DescriptorPose = {
    rootBone: root.name,
    rootPosition: toVec(root.position),
    bones: {},
  };
  for (const bone of bones) {
    if (!isPosable(bone.name)) continue;
    pose.bones[bone.name] = { rotationDeg: quatToEulerDeg(bone.quaternion) };
  }
  return pose;
}

// Apply an editable pose onto a live character object. Bones absent from
// the pose are left untouched. Returns true if anything was applied.
export function applyPose(
  object: THREE.Object3D,
  pose: DescriptorPose | undefined,
): boolean {
  if (!pose?.bones) return false;
  const byName = new Map<string, THREE.Bone>();
  for (const bone of collectBones(object)) byName.set(bone.name, bone);

  let applied = 0;
  for (const [name, bonePose] of Object.entries(pose.bones)) {
    const bone = byName.get(name);
    const rot = bonePose?.rotationDeg;
    if (!bone || !rot) continue;
    bone.quaternion.setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(rot.x ?? 0),
        THREE.MathUtils.degToRad(rot.y ?? 0),
        THREE.MathUtils.degToRad(rot.z ?? 0),
        "XYZ",
      ),
    );
    applied++;
  }

  if (pose.rootBone && pose.rootPosition) {
    const root = byName.get(pose.rootBone);
    if (root) {
      root.position.set(
        pose.rootPosition.x,
        pose.rootPosition.y,
        pose.rootPosition.z,
      );
      applied++;
    }
  }

  // Recompute world matrices so the skinned mesh reflects the new pose on
  // the next frame (mirrors what the FK drag path relies on).
  if (applied > 0) object.updateMatrixWorld(true);
  return applied > 0;
}

function collectBones(object: THREE.Object3D): THREE.Bone[] {
  const bones: THREE.Bone[] = [];
  object.traverse((child) => {
    if ((child as THREE.Bone).isBone || child.type === "Bone") {
      bones.push(child as THREE.Bone);
    }
  });
  return bones;
}

function isPosable(name: string): boolean {
  const lower = name.toLowerCase();
  return !FKBoneBlacklistStrings.some((b) => lower.includes(b));
}

function quatToEulerDeg(q: THREE.Quaternion): Vec3 {
  const e = new THREE.Euler().setFromQuaternion(q, "XYZ");
  return {
    x: round(THREE.MathUtils.radToDeg(e.x)),
    y: round(THREE.MathUtils.radToDeg(e.y)),
    z: round(THREE.MathUtils.radToDeg(e.z)),
  };
}

function toVec(v: THREE.Vector3): Vec3 {
  return { x: round(v.x), y: round(v.y), z: round(v.z) };
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e5) / 1e5;
}
