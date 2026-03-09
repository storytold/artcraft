import { v4 as uuidv4 } from "uuid";
import { MediaUploadApi } from "~/Classes/ApiManager";
import { UploaderStates } from "~/enums";
import { UploaderState } from "~/models";
import { getFileName } from "~/utilities";

export const uploadAudio = async ({
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

  const audioResponse = await mediaUploadApi.UploadAudio({
    uuid: uuidv4(),
    blob: assetFile,
    fileName: getFileName(assetFile),
    maybe_title: "ref_audio_" + title,
  });

  if (audioResponse == undefined) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: "Could not upload audio!",
    });
    return;
  }

  if (!audioResponse.success || !audioResponse.data) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: audioResponse.errorMessage,
    });
    return;
  }

  progressCallback({
    status: UploaderStates.success,
    data: audioResponse.data,
  });
};
