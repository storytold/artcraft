// uploadPlane: the upload pipeline for "plane" assets (a flat image or mp4 placed in a 3D scene).
// Used by pages/PageScene/useTauriPageSceneAdapter.tsx (uploadPlaneFromMediaToken).
// FIX: the older uploadPlane/takeVideoSnapshot path was only reachable from the unmounted UploadModalMedia dialogs and was removed with them.
// Talks to the web backend through MediaFilesApi from ~/Classes/ApiManager and reports
// every step through a progressCallback so the UI can show the matching screen.

import { UploaderStates } from "~/enums";
import { MediaFilesApi } from "~/Classes/ApiManager";
import { UploaderState } from "~/models";

/**
 * Finish a "plane" upload for a file that is ALREADY on the server (identified by mediaToken): look it up,
 * rename it to title if the title differs, then report success. progressCallback gets the same statuses as uploadPlane
 * (the thumbnail/cover steps are skipped because the media already has one).
 */
export const uploadPlaneFromMediaToken = async ({
  title,
  mediaToken,
  progressCallback,
}: {
  title: string;
  mediaToken: string;
  progressCallback: (newState: UploaderState) => void;
}) => {
  // Step 1: Set uploading state (simulate asset upload)
  progressCallback({ status: UploaderStates.uploadingAsset });

  // Step 2: Fetch the media file info (to get type, etc.)
  const mediaFilesApi = new MediaFilesApi();
  const mediaFileResponse = await mediaFilesApi.GetMediaFileByToken({
    mediaFileToken: mediaToken,
  });
  if (!mediaFileResponse.success || !mediaFileResponse.data) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage:
        mediaFileResponse.errorMessage ||
        "Could not fetch media file by token.",
    });
    return;
  }

  // Step 3: Optionally set the title (rename)
  if (title && mediaFileResponse.data.maybe_title !== title) {
    const renameResponse = await mediaFilesApi.RenameMediaFileByToken({
      mediaToken,
      name: title,
    });
    if (!renameResponse.success) {
      progressCallback({
        status: UploaderStates.assetError,
        errorMessage:
          renameResponse.errorMessage || "Could not rename media file.",
      });
      return;
    }
  }

  // Step 4: (Optional) Set cover image if needed (skip if already set)
  // For simplicity, we skip cover image upload here, but you could add logic to set a cover if needed.

  // Step 5: Success
  progressCallback({ status: UploaderStates.success });
};
