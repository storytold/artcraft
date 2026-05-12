import { v4 as uuidv4 } from "uuid";
import { MediaUploadApi } from "@storyteller/api";
import {
  FilterEngineCategories,
  MediaFileAnimationType,
  getFileExtension,
} from "../../Types";

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

  switch (fileExtension) {
    case ".spz":
      return mediaUploadApi.UploadSpzFile({
        file,
        fileName: file.name,
        uuid: uuidv4(),
        maybe_title: title,
      });
    case ".zip":
      return mediaUploadApi.UploadPmx({
        file,
        fileName: file.name,
        engine_category: engineCategory,
        maybe_title: title,
        maybe_animation_type: animationType,
        uuid: uuidv4(),
      });
    default:
      return mediaUploadApi.UploadNewEngineAsset({
        file,
        fileName: file.name,
        engine_category: engineCategory,
        maybe_title: title,
        maybe_animation_type: animationType,
        uuid: uuidv4(),
      });
  }
};
