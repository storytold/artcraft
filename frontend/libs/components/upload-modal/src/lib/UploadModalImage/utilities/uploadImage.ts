// uuid v4 generator: a fresh random id per upload, sent to the backend as its idempotency token.
import { v4 as uuidv4 } from "uuid";
// The API client that talks to the backend's media-upload endpoints (network calls happen inside it).
import { MediaUploadApi } from "@storyteller/api";
import {
  // The shape of every progress report handed to the caller's callback.
  UploaderState,
  // The step names reported through that callback.
  UploaderStates,
  // File name without its extension.
  getFileName,
} from "../../Types";

// Uploads ONE image file to the image endpoint and reports the result through `progressCallback`
// (uploadingAsset, then success with the new media token in `data`, or assetError). Unlike the 3D pipeline
// there is no cover step. Called by uploadImagesBatch (several files) and directly by UploadFilesImage.tsx
// (a lone file, and the per-row Retry button); touches only the network.
export const uploadImage = async ({
  title,
  assetFile,
  progressCallback,
}: {
  // Display title for the new image (callers pass the file name without its extension).
  title: string;
  // The image file to upload.
  assetFile: File;
  // Receives every state change; the final call is `success` or `assetError`.
  progressCallback: (newState: UploaderState) => void;
}) => {
  // A fresh API client per call; it holds no state.
  const mediaUploadApi = new MediaUploadApi();

  // Tell the caller the upload has started (this runs synchronously, before the first await).
  progressCallback({ status: UploaderStates.uploadingAsset });

  // Send the file. The blob's file name is sent without its extension.
  const assetResponse = await mediaUploadApi.UploadImage({
    blob: assetFile,
    fileName: getFileName(assetFile),
    uuid: uuidv4(),
    maybe_title: title,
  });

  // Defensive: the API client should always return an object; report a generic failure if it did not.
  if (assetResponse == undefined) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: "Could not upload image plane!",
    });
    return;
  }

  // The backend refused the file (or returned no media token): report its message and stop.
  if (!assetResponse.success || !assetResponse.data) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: assetResponse.errorMessage,
    });
    return;
  }

  // Done: hand the new image's media token back in `data`.
  progressCallback({
    status: UploaderStates.success,
    data: assetResponse.data,
  });
};
