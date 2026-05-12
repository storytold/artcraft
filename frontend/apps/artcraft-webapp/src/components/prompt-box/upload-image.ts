import { EIntermediateFile, MediaUploadApi } from "@storyteller/api";
import { UploaderState, UploaderStates } from "@storyteller/common";

export type UploadImageFn = (args: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => Promise<void>;

export const uploadImage: UploadImageFn = async ({
  title,
  assetFile,
  progressCallback,
}) => {
  const mediaUploadApi = new MediaUploadApi();

  progressCallback({ status: UploaderStates.uploadingImage });

  const response = await mediaUploadApi.UploadImage({
    uuid: crypto.randomUUID(),
    blob: assetFile,
    fileName: assetFile.name || `reference-${Date.now()}`,
    maybe_title: `ref_image_${title}`,
    // User-uploaded reference images should appear in their library, not be
    // hidden as intermediate system files.
    is_intermediate_system_file: EIntermediateFile.false,
  });

  if (!response?.success || !response.data) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: response?.errorMessage ?? "Could not upload image",
    });
    return;
  }

  progressCallback({
    status: UploaderStates.success,
    data: response.data,
  });
};
