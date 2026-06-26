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
  Vec3,
} from "./scene_descriptor";

export { buildSceneDescriptor } from "./export_descriptor";
export { applySceneDescriptor } from "./apply_descriptor";
export type { ApplyResult } from "./apply_descriptor";
export { exportSceneToGltf, exportSceneToUsdz } from "./universal_export";
