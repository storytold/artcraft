// Experimental "scene enhancement" — universal scene descriptor.
// Round-trip: buildSceneDescriptor → (edit / LLM) → applySceneDescriptor.

export {
  SCENE_DESCRIPTOR_VERSION,
  GRAY_BOX_COLOR,
} from "./scene_descriptor";
export type {
  SceneDescriptor,
  DescriptorEntity,
  DescriptorEntityKind,
  DescriptorTransform,
  DescriptorCamera,
  DescriptorEnvironment,
  DescriptorPose,
  DescriptorGeometry,
  DescriptorInstancing,
  InstancingBase,
  InstancingScatter,
  InstanceTransform,
  ShaderMaterialSpec,
  BonePose,
  Vec3,
} from "./scene_descriptor";

export { buildSceneDescriptor } from "./export_descriptor";
export type { BuildDescriptorOptions } from "./export_descriptor";
export { applySceneDescriptor } from "./apply_descriptor";
export type { ApplyResult } from "./apply_descriptor";
export { extractPose, applyPose } from "./pose_codec";
export { extractGeometry } from "./geometry_codec";
export { resolveInstancing } from "./instancing_codec";
export {
  exportSceneToGltf,
  exportSceneToGltfText,
  exportSceneToUsdz,
} from "./universal_export";
