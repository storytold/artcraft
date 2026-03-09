import { v4 as uuidv4 } from "uuid";
import { MediaUploadApi } from "~/Classes/ApiManager";
import { UploaderStates } from "~/enums";
import { UploaderState } from "~/models";
import { getFileName } from "~/utilities";

export const uploadVideo = async ({
  title,
  assetFile,
  progressCallback,
}: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => {
  const mediaUploadApi = new MediaUploadApi();

  progressCallback({ status: UploaderStates.uploadingImage });

  const videoResponse = await mediaUploadApi.UploadNewVideo({
    uuid: uuidv4(),
    blob: assetFile,
    fileName: getFileName(assetFile),
    maybe_title: "ref_video_" + title,
  });

  if (videoResponse == undefined) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: "Could not upload video!",
    });
    return;
  }

  if (!videoResponse.success || !videoResponse.data) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: videoResponse.errorMessage,
    });
    return;
  }

  progressCallback({
    status: UploaderStates.success,
    data: videoResponse.data,
  });
};
