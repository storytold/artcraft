// Re-export canonical FilterEngineCategories from @storyteller/api so the
// upload-modal lib stays in sync with the wire-format enum.
export { FilterEngineCategories } from "@storyteller/api";

// Upload pipeline state machine shared by all three upload modals.
// NOTE: this enum exists in three copies (here, `libs/common/src/lib/enums/UploaderStates.ts`, and
// `apps/artcraft/app/src/enums/UploaderStates.ts`). They are numeric enums, so the member ORDER is the value:
// the copies are identical today, and a member added or moved in only one of them would make the same status
// compare as a different one across the libraries. Change all three together.
export enum UploaderStates {
  // Idle: nothing is uploading; the Upload button is available.
  ready,
  // The main file (model / splat) is being sent.
  uploadingAsset,
  // An image file is being sent (set by MediaUploadApi's image upload helpers).
  uploadingImage,
  // A cover (thumbnail) image for the asset is being sent.
  uploadingCover,
  // The uploaded cover is being attached to the asset.
  settingCover,
  // Every step finished.
  success,
  // The main file's upload failed.
  assetError,
  // Creating the cover image failed.
  coverCreateError,
  // Attaching the cover to the asset failed.
  coverSetError,
  // The image upload failed (set by MediaUploadApi's image upload helpers).
  imageCreateError,
}

// What the upload modals keep in React state to render progress and errors.
export interface UploaderState {
  // Where the pipeline currently is (see UploaderStates).
  status: UploaderStates;
  // Human-readable error text to show when `status` is one of the *Error states.
  errorMessage?: string;
  // Optional payload a pipeline may attach (the 3D pipeline reports `success` without one).
  data?: string;
  // "current of total" counter; read by the three modals' uploading screens to show multi-file progress
  // (nothing inside this lib sets it).
  uploadProgress?: { current: number; total: number };
}

// The state every modal starts in (and returns to on reset): idle, no error, no data.
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
// FBX is accepted at the picker but converted to GLB in the browser before
// preview/upload (convertFbxToGlb) — the rest of the pipeline is GLTF-only.
export enum OBJECT_FILE_TYPE {
  // glTF binary: the format the pipeline actually uploads.
  GLB = "glb",
  // Autodesk FBX: accepted, then converted to GLB in the browser before preview and upload.
  FBX = "fbx",
}

// Extensions the Image dialog's picker offers.
export enum IMAGEPLANE_FILE_TYPE {
  PNG = "png",
  JPG = "jpg",
  JPEG = "jpeg",
}

// Extensions the Splat dialog's picker offers (SPZ = compressed Gaussian splat).
export enum SPLAT_FILE_TYPE {
  SPZ = "spz",
}

// File name without its extension ("robot.glb" -> "robot"); used as the default title. A name with no "."
// gives "" (lastIndexOf is -1 and substring clamps a negative end to 0).
export const getFileName = (file: File): string =>
  file.name.substring(0, file.name.lastIndexOf("."));

// BUG FIX: returned the extension exactly as typed, but the file picker and the global drop handler accept
// extensions case-insensitively ("Scene.SPZ" is offered to the dialog), and every caller compares the result
// to lowercase literals (".spz", ".zip"). An upper-case name fell through to the generic engine-asset endpoint.
// Lowercased here so the one comparison point is case-insensitive. Returns the extension with its dot
// (".spz"); a name with no "." gives the whole name lowercased (substring clamps -1 to 0), which matches no
// known extension and so falls through to the generic upload endpoint.
export const getFileExtension = (file: File): string =>
  file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

// The name sent to the backend: the base name keeps its case, the extension is lowercase (the documented rule
// above — "the backend rejects uppercase"). A name with no "." is returned unchanged.
export const getUploadFileName = (file: File): string => {
  // Position of the last dot, or -1 when the name has no extension.
  const dot = file.name.lastIndexOf(".");
  // No extension: nothing to normalise.
  if (dot === -1) return file.name;
  // Base name as typed + lowercase extension.
  return file.name.slice(0, dot) + file.name.slice(dot).toLowerCase();
};

// Per-file row status shown in the multi-file upload sidebar. "converting"
// = an FBX being normalized to GLB client-side before it can be previewed
// or uploaded.
export type FileEntryStatus =
  | "idle"
  | "converting"
  | "uploading"
  | "success"
  | "error";
