// uuid v4 generator: a fresh random id per upload, sent to the backend as its idempotency token.
import { v4 as uuidv4 } from "uuid";
// The two API clients used below: media-file edits (set the cover) and media uploads (send the image).
import { MediaFilesApi, MediaUploadApi } from "@storyteller/api";
// File name without its extension.
import { getFileName } from "../../Types";

// Takes a picture of the preview canvas as a PNG blob (toBlob's default type) and hands it to `resultCallback`.
// The function itself resolves right away: the blob arrives LATER, through the callback, with `undefined` if
// the browser could not encode the canvas. If there is no canvas it returns without ever calling the callback.
// Called by UploadFiles3D.tsx and UploadFilesSplat.tsx after the preview has loaded; reads the canvas only.
export const snapshotCanvasAsThumbnail = async ({
  targetNode,
  resultCallback,
}: {
  // The preview canvas to photograph (undefined before the preview exists).
  targetNode: HTMLCanvasElement | undefined;
  // Receives the PNG blob, or undefined when encoding failed.
  resultCallback: (blob: Blob | undefined) => void;
}) => {
  // Nothing to photograph yet: do nothing (the callback is NOT called).
  if (!targetNode) return undefined;
  // Encode the canvas asynchronously; `blob` is null when encoding fails, which we report as undefined.
  targetNode.toBlob((blob: Blob | null) => {
    resultCallback(blob || undefined);
  });
};

// Step 2 of the 3D pipeline (see upload3DObjects.ts): uploads the snapshot as an ordinary image and returns
// the upload result ({ success, data, errorMessage }); on success `data` is the image's media token. Network only.
export const uploadSnapshotAsThumbnail = async ({
  assetTitle = "unknown_asset",
  blob,
}: {
  // Title of the asset the cover belongs to; only used to name the image ("thumbnail_<title>").
  assetTitle?: string;
  // The PNG blob from snapshotCanvasAsThumbnail.
  blob: Blob;
}) => {
  // Wrap the blob in a File so the upload has a name; every cover is named "storyteller-cap.png".
  const thumbnailFile = new File([blob], "storyteller-cap.png");
  // The title the backend stores for the cover image.
  const thumbnailTitle = "thumbnail_" + assetTitle;

  // A fresh API client per call; it holds no state.
  const mediaUploadApi = new MediaUploadApi();
  // Send it through the normal image endpoint, with a new idempotency token each time.
  return await mediaUploadApi.UploadImage({
    uuid: uuidv4(),
    blob: thumbnailFile,
    fileName: getFileName(thumbnailFile),
    maybe_title: thumbnailTitle,
  });
};

// Step 3 of the 3D pipeline: tells the backend to use the uploaded image as the asset's cover. Returns
// { success, errorMessage } (the API client turns thrown errors into success: false). Network only.
export const setThumbnail = async ({
  assetToken,
  thumbnailToken,
}: {
  // Media token of the saved asset (the result of step 1).
  assetToken: string;
  // Media token of the cover image (the `data` from uploadSnapshotAsThumbnail).
  thumbnailToken: string;
}) => {
  // A fresh API client per call; it holds no state.
  const mediaFilesApi = new MediaFilesApi();
  // POSTs the pairing to the backend's cover-image route for this asset.
  return await mediaFilesApi.UpdateCoverImage({
    mediaFileToken: assetToken,
    imageToken: thumbnailToken,
  });
};
