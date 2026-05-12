import {
  FilterEngineCategories,
  MediaFileAnimationType,
  UploaderState,
  UploaderStates,
} from "../../Types";
import { setThumbnail, uploadSnapshotAsThumbnail } from "./thumbnailHelpers";
import { uploadAsset } from "./uploadAsset";

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

  const assetResponse = await uploadAsset({
    file: assetFile,
    title,
    engineCategory,
    animationType,
  });

  if (!assetResponse.success || !assetResponse.data) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: assetResponse.errorMessage,
    });
    return;
  }
  const assetToken = assetResponse.data;

  if (!thumbnailSnapshot) {
    progressCallback({ status: UploaderStates.success });
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
    assetToken,
    thumbnailToken,
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
