import { MediaUploadApi } from "~/Classes/ApiManager";
import { FilterEngineCategories, MediaFileAnimationType } from "~/enums";
import { getFileExtension } from "~/utilities";
import { v4 as uuidv4 } from "uuid";

export const uploadAsset = async ({
  file,
  title,
  engineCategory,
  animationType,
}: {
  file: File;
  title: string;
  engineCategory: FilterEngineCategories;
  animationType?: MediaFileAnimationType;
}) => {
  const mediaUploadApi = new MediaUploadApi();
  const fileExtension = getFileExtension(file);
  const assetReponse = await (async () => {
    switch (fileExtension) {
      case ".zip":
        return mediaUploadApi.UploadPmx({
          file: file,
          fileName: file.name,
          engine_category: engineCategory,
          maybe_title: title,
          maybe_animation_type: animationType,
          uuid: uuidv4(),
        });
      default:
        return mediaUploadApi.UploadNewEngineAsset({
          file: file,
          fileName: file.name,
          engine_category: engineCategory,
          maybe_title: title,
          maybe_animation_type: animationType,
          uuid: uuidv4(),
        });
    }
  })();

  return assetReponse;
};
