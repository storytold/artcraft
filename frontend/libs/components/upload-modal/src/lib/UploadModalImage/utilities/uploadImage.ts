import { v4 as uuidv4 } from "uuid";
import { MediaUploadApi } from "@storyteller/api";
import {
  UploaderState,
  UploaderStates,
  getFileName,
} from "../../Types";

export const uploadImage = async ({
  title,
  assetFile,
  progressCallback,
}: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => {
  const mediaUploadApi = new MediaUploadApi();

  progressCallback({ status: UploaderStates.uploadingAsset });

  const assetResponse = await mediaUploadApi.UploadImage({
    blob: assetFile,
    fileName: getFileName(assetFile),
    uuid: uuidv4(),
    maybe_title: title,
  });

  if (assetResponse == undefined) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: "Could not upload image plane!",
    });
    return;
  }

  if (!assetResponse.success || !assetResponse.data) {
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: assetResponse.errorMessage,
    });
    return;
  }

  progressCallback({
    status: UploaderStates.success,
    data: assetResponse.data,
  });
};
