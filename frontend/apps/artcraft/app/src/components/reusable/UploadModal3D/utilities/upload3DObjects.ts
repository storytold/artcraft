import {
  FilterEngineCategories,
  MediaFileAnimationType,
  UploaderStates,
} from "~/enums";
import { setThumbnail, uploadSnapshotAsThumbnail } from "./thumbnailHelpers";

import { uploadAsset } from "./uploadAsset";
import { UploaderState } from "~/models";

export const upload3DObjects = async ({
  title,
  assetFile,
  engineCategory,
  thumbnailSnapshot,
  animationType,
  progressCallback,
}: {
  title: string;
  assetFile: File;
  engineCategory: FilterEngineCategories;
  thumbnailSnapshot: Blob | undefined;
  animationType?: MediaFileAnimationType;
  progressCallback: (newState: UploaderState) => void;
}) => {
  progressCallback({ status: UploaderStates.uploadingAsset });

  const assetReponse = await uploadAsset({
    file: assetFile,
    title: title,
    engineCategory: engineCategory,
    animationType: animationType,
  });

  if (!assetReponse.success || !assetReponse.data) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: assetReponse.errorMessage,
    });
    return;
  }
  const assetToken = assetReponse.data;

  if (!thumbnailSnapshot) {
    progressCallback({ status: UploaderStates.success, data: assetToken });
    return;
  }

  progressCallback({ status: UploaderStates.uploadingCover });
  const thumbnailResponse = await uploadSnapshotAsThumbnail({
    assetTitle: title,
    blob: thumbnailSnapshot,
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
  const setThumbnailResponse = await setThumbnail({
    assetToken: assetToken,
    thumbnailToken: thumbnailToken,
  });
  if (!setThumbnailResponse.success) {
    progressCallback({
      status: UploaderStates.coverSetError,
      errorMessage: setThumbnailResponse.errorMessage,
    });
    return;
  }
  progressCallback({ status: UploaderStates.success, data: assetToken });
};
