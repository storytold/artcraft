// Re-export canonical FilterEngineCategories from @storyteller/api so the
// upload-modal lib stays in sync with the wire-format enum.
export { FilterEngineCategories } from "@storyteller/api";

// Upload pipeline state machine shared by all three upload modals.
export enum UploaderStates {
  ready,
  uploadingAsset,
  uploadingImage,
  uploadingCover,
  settingCover,
  success,
  assetError,
  coverCreateError,
  coverSetError,
  imageCreateError,
}

export interface UploaderState {
  status: UploaderStates;
  errorMessage?: string;
  data?: string;
  uploadProgress?: { current: number; total: number };
}

export const initialUploaderState: UploaderState = {
  status: UploaderStates.ready,
};

// Animation rig type — used when uploading a Character asset.
// String values are the wire-format the backend expects.
export enum MediaFileAnimationType {
  ArKit = "ar_kit",
  MikuMikuDance = "miku_miku_dance",
  MikuMikuDanceArKit = "miku_miku_dance_ar_kit",
  Mixamo = "mixamo",
  MixamoArKit = "mixamo_ar_kit",
  MocapNet = "mocap_net",
  MocapNetArKit = "mocap_net_ar_kit",
  MoveAi = "move_ai",
  MoveAiArKit = "move_ai_ar_kit",
  Rigify = "rigify",
  RigifyArKit = "rigify_ar_kit",
  Rokoko = "rokoko",
}

// Accepted file extensions (lowercase — the backend rejects uppercase).
export enum OBJECT_FILE_TYPE {
  GLB = "glb",
}

export enum IMAGEPLANE_FILE_TYPE {
  PNG = "png",
  JPG = "jpg",
  JPEG = "jpeg",
}

export enum SPLAT_FILE_TYPE {
  SPZ = "spz",
}

export const getFileName = (file: File): string =>
  file.name.substring(0, file.name.lastIndexOf("."));

export const getFileExtension = (file: File): string =>
  file.name.substring(file.name.lastIndexOf("."));

// Per-file row status shown in the multi-file upload sidebar.
export type FileEntryStatus = "idle" | "uploading" | "success" | "error";
