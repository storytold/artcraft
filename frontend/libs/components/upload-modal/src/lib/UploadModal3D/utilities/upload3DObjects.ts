import {
  // Wire-format "engine category" (character / object / set / animation ...) for the asset.
  FilterEngineCategories,
  // Optional rig type for characters.
  MediaFileAnimationType,
  // The shape of every progress report handed to the caller's callback.
  UploaderState,
  // The pipeline step names reported through that callback.
  UploaderStates,
} from "../../Types";
// Cover-image helpers: upload the snapshot as an image, then attach it to the asset as its cover.
import { setThumbnail, uploadSnapshotAsThumbnail } from "./thumbnailHelpers";
// Sends the model / splat file itself to the right endpoint.
import { uploadAsset } from "./uploadAsset";

// Uploads ONE 3D file (model, splat or animation) and, when a preview snapshot exists, its cover image:
//   1. the asset  -> 2. the snapshot as an image  -> 3. attach the image as the asset's cover.
// A step that comes back unsuccessful is reported through `progressCallback` and the function returns, so
// callers (the 3D and Splat dialogs, and upload3DObjectsBatch) watch the callback; this function has no
// try/catch of its own, so an unexpected exception from the API client would propagate (the batch wrapper
// catches it). The asset is saved
// at step 1, so a failure at step 2 or 3 leaves a saved asset (see N-105 in BUGS.md). Touches only the
// network (via uploadAsset / thumbnailHelpers); the callback is the only way state leaves this function.
export const upload3DObjects = async ({
  title,
  assetFile,
  engineCategory,
  thumbnailSnapshot,
  animationType,
  durationMillis,
  progressCallback,
}: {
  // Display title for the new asset (callers pass the file name without its extension).
  title: string;
  // The 3D / splat file to upload.
  assetFile: File;
  // Which library bucket the asset goes in.
  engineCategory: FilterEngineCategories;
  // PNG snapshot of the preview canvas, or undefined when none was captured (then no cover steps run).
  thumbnailSnapshot: Blob | undefined;
  // Optional rig type for characters.
  animationType?: MediaFileAnimationType;
  // Required by the backend when engineCategory is "animation".
  durationMillis?: number;
  // Receives every state change; the final call is `success` or one of the *Error states.
  progressCallback: (newState: UploaderState) => void;
}) => {
  // Tell the caller step 1 has started (this runs synchronously, before the first await).
  progressCallback({ status: UploaderStates.uploadingAsset });

  // Step 1: send the asset itself.
  const assetResponse = await uploadAsset({
    file: assetFile,
    title,
    engineCategory,
    animationType,
    durationMillis,
  });

  // The asset failed (or came back without a token): report it and stop; nothing was saved.
  if (!assetResponse.success || !assetResponse.data) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: assetResponse.errorMessage,
    });
    return;
  }
  // The new asset's media token, needed in step 3 to attach the cover to it.
  const assetToken = assetResponse.data;

  // No preview snapshot was captured for this file: the asset alone is the whole upload.
  if (!thumbnailSnapshot) {
    progressCallback({ status: UploaderStates.success });
    return;
  }

  // Step 2: upload the snapshot as an image.
  progressCallback({ status: UploaderStates.uploadingCover });
  const thumbnailResponse = await uploadSnapshotAsThumbnail({
    assetTitle: title,
    blob: thumbnailSnapshot,
  });
  // The cover image failed to upload. The asset from step 1 is already saved (see N-105 in BUGS.md).
  if (!thumbnailResponse.success || !thumbnailResponse.data) {
    progressCallback({
      status: UploaderStates.coverCreateError,
      errorMessage: thumbnailResponse.errorMessage,
    });
    return;
  }

  // Step 3: attach the uploaded image to the asset as its cover.
  progressCallback({ status: UploaderStates.settingCover });
  // The cover image's media token.
  const thumbnailToken = thumbnailResponse.data;
  const setThumbnailResponse = await setThumbnail({
    assetToken,
    thumbnailToken,
  });
  // Attaching failed: the asset and the cover image both exist but are not linked.
  if (!setThumbnailResponse.success) {
    progressCallback({
      status: UploaderStates.coverSetError,
      errorMessage: setThumbnailResponse.errorMessage,
    });
    return;
  }
  // All three steps finished.
  progressCallback({ status: UploaderStates.success });
};
