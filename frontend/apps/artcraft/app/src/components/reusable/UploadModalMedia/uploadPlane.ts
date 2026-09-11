import { v4 as uuidv4 } from "uuid";
import { UploaderStates, FilterEngineCategories } from "~/enums";
import { MediaUploadApi, MediaFilesApi } from "~/Classes/ApiManager";
import { getFileName } from "~/utilities";
import { UploaderState } from "~/models";

export const uploadPlane = async ({
  title,
  assetFile,
  progressCallback,
}: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => {
  progressCallback({ status: UploaderStates.uploadingAsset });
  const mediaUploadApi = new MediaUploadApi();
  const assetFileName = assetFile.name;
  const engineCategory = assetFileName.endsWith(".mp4")
    ? FilterEngineCategories.VIDEO_PLANE
    : FilterEngineCategories.IMAGE_PLANE;

  const assetReponse = await mediaUploadApi.UploadNewEngineAsset({
    file: assetFile,
    fileName: assetFileName,
    engine_category: engineCategory,
    maybe_title: title,
    uuid: uuidv4(),
  });

  if (!assetReponse.success || !assetReponse.data) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: assetReponse.errorMessage,
    });
    return;
  }

  progressCallback({ status: UploaderStates.uploadingCover });

  const thumbnailBlob = assetFileName.endsWith(".mp4")
    ? await takeVideoSnapshot(assetFile, progressCallback) // snap an image from the video
    : assetFile; //the file is already an image

  if (!thumbnailBlob) {
    progressCallback({
      status: UploaderStates.coverCreateError,
      errorMessage: `Could not make thumbnail from ${assetFileName}!`,
    });
    return;
  }

  const thumbnailResponse = await mediaUploadApi.UploadImage({
    uuid: uuidv4(),
    blob: thumbnailBlob,
    fileName: getFileName(assetFile),
    maybe_title: "thumbnail_" + title,
  });

  if (thumbnailResponse == undefined) {
    progressCallback({
      status: UploaderStates.coverCreateError,
      errorMessage: "Could not upload thumbnail!",
    });
    return;
  }

  if (!thumbnailResponse.success || !thumbnailResponse.data) {
    progressCallback({
      status: UploaderStates.coverCreateError,
      errorMessage: thumbnailResponse.errorMessage,
    });
    return;
  }

  progressCallback({ status: UploaderStates.settingCover });

  const mediaFilesApi = new MediaFilesApi();
  const setThumbnailResponse = await mediaFilesApi.UpdateCoverImage({
    mediaFileToken: assetReponse.data,
    imageToken: thumbnailResponse.data,
  });
  if (!setThumbnailResponse.success) {
    progressCallback({
      status: UploaderStates.coverSetError,
      errorMessage: setThumbnailResponse.errorMessage,
    });
    return;
  }
  progressCallback({ status: UploaderStates.success });
};

const takeVideoSnapshot = async (
  videoFile: File,
  errorCallback: (newState: UploaderState) => void,
): Promise<Blob | undefined> => {
  const canvas = document.createElement("canvas");
  const video = document.createElement("video");
  video.src = URL.createObjectURL(videoFile);
  video.controls = false;
  video.muted = true;
  video.loop = true;
  await video.play();
  video.width = 512;
  video.height = 512;
  canvas.width = 512;
  canvas.height = 512;

  if (video === null) {
    errorCallback({
      status: UploaderStates.coverCreateError,
      errorMessage: "Could not upload thumbnail, video does not exist!",
    });
    return;
  }

  const ctx = canvas.getContext("2d");
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

  const image = canvas.toDataURL("image/png");
  const blob = await (await fetch(image)).blob();

  return blob;
};

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
