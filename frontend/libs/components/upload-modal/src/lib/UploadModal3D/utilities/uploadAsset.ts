// uuid v4 generator: each upload gets a fresh random id, sent to the backend as its idempotency token.
import { v4 as uuidv4 } from "uuid";
// The API client that talks to the backend's media-upload endpoints (network calls happen inside it).
import { MediaUploadApi } from "@storyteller/api";
import {
  // Type of the "engine category" field (character / object / set / animation ...) sent to the backend.
  FilterEngineCategories,
  // Type of the optional animation rig kind (only used when the category is an animation / character).
  MediaFileAnimationType,
  // Lowercase file extension including the dot (".glb"), used to pick the endpoint.
  getFileExtension,
  // The file name to send over the wire (extension lowercased).
  getUploadFileName,
} from "../../Types";

// Sends one chosen file to the right upload endpoint for its type and returns that endpoint's promise
// (the caller awaits it and reads success / data / error off the result). Called only by upload3DObjects,
// which the 3D and Splat dialogs use for their upload step; it touches only the network (via
// MediaUploadApi), never the DOM or any store.
export const uploadAsset = async ({
  file,
  title,
  engineCategory,
  animationType,
  durationMillis,
}: {
  // The file the user picked or dropped.
  file: File;
  // Display title the user typed; stored on the new media file as its title.
  title: string;
  // Which library bucket the asset belongs in.
  engineCategory: FilterEngineCategories;
  // Optional rig type for characters.
  animationType?: MediaFileAnimationType;
  // Required by the backend when engineCategory is "animation".
  durationMillis?: number;
}) => {
  // A fresh API client per call; it holds no state, so this is cheap.
  const mediaUploadApi = new MediaUploadApi();
  // Lowercase extension (".spz"), so "Scene.SPZ" picks the same endpoint as "scene.spz".
  const fileExtension = getFileExtension(file);
  // BUG FIX: the name sent to the backend carries a lowercase extension (see Types.getUploadFileName); the
  // base name is untouched. A lowercase file name is passed through unchanged.
  const fileName = getUploadFileName(file);

  // Pick the endpoint from the extension: splat files, zipped (PMX) models, and everything else (GLB ...).
  switch (fileExtension) {
    // Gaussian-splat file: its own endpoint; it takes no engine category or animation type.
    case ".spz":
      return mediaUploadApi.UploadSpzFile({
        file,
        fileName,
        uuid: uuidv4(),
        maybe_title: title,
      });
    // Zipped model (PMX / MikuMikuDance style): its own endpoint, which does take a category and rig type.
    case ".zip":
      return mediaUploadApi.UploadPmx({
        file,
        fileName,
        engine_category: engineCategory,
        maybe_title: title,
        maybe_animation_type: animationType,
        uuid: uuidv4(),
      });
    // Anything else (GLB today; FBX is converted to GLB before it gets here): the generic engine-asset
    // endpoint, the only one that also accepts an animation duration.
    default:
      return mediaUploadApi.UploadNewEngineAsset({
        file,
        fileName,
        engine_category: engineCategory,
        maybe_title: title,
        maybe_animation_type: animationType,
        maybe_duration_millis: durationMillis,
        uuid: uuidv4(),
      });
  }
};
