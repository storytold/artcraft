import { v4 as uuidv4 } from "uuid";

import {
  FilterEngineCategories,
} from "@storyteller/api";
import {
  UploaderStates,
  MediaFileAnimationType,
  UploaderState
} from "@storyteller/common";

import { MediaUploadApi, MediaFilesApi } from "@storyteller/api";

export const uploadAssets = async ({
  title,
  assetFile,
  thumbnailFile,
  engineCategory,
  animationType,
  length,
  progressCallback,
  getFileName,
  getFileExtension,
}: {
  title: string;
  assetFile: File;
  engineCategory: FilterEngineCategories;
  thumbnailFile?: File;
  animationType?: MediaFileAnimationType;
  length?: number;
  progressCallback: (newState: UploaderState) => void;
  getFileName: (file: File) => string;
  getFileExtension: (file: File) => string;
}) => {
  progressCallback({ status: UploaderStates.uploadingAsset });
  const mediaUploadApi = new MediaUploadApi();

  const fileExtension = getFileExtension(assetFile);
  const assetReponse = await (async () => {
    switch (fileExtension) {
      case ".zip":
        return mediaUploadApi.UploadPmx({
          file: assetFile,
          fileName: assetFile.name,
          engine_category: engineCategory,
          maybe_title: title,
          maybe_animation_type: animationType,
          uuid: uuidv4(),
        });
      default:
        return mediaUploadApi.UploadNewEngineAsset({
          file: assetFile,
          fileName: assetFile.name,
          engine_category: engineCategory,
          maybe_animation_type: animationType,
          maybe_duration_millis: length,
          maybe_title: title,
          uuid: uuidv4(),
        });
    }
  })();

  if (!assetReponse.success || !assetReponse.data) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: assetReponse.errorMessage,
    });
    return;
  }
  const assetToken = assetReponse.data;
  if (!thumbnailFile) {
    progressCallback({ status: UploaderStates.success });
    return;
  }

  progressCallback({ status: UploaderStates.uploadingCover });
  const thumbnailResponse = await mediaUploadApi.UploadImage({
    uuid: uuidv4(),
    blob: thumbnailFile,
    fileName: getFileName(thumbnailFile),
    maybe_title: "thumbnail_" + title,
  });
  if (!thumbnailResponse.success || !thumbnailResponse.data) {
    progressCallback({
      status: UploaderStates.coverCreateError,
      errorMessage: thumbnailResponse.errorMessage,
    });
    return;
  }

  progressCallback({ status: UploaderStates.settingCover });
  const thumbnailToken = thumbnailResponse.data;
  const mediaFilesApi = new MediaFilesApi();
  const setThumbnailResponse = await mediaFilesApi.UpdateCoverImage({
    mediaFileToken: assetToken,
    imageToken: thumbnailToken,
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
