import { v4 as uuidv4 } from "uuid";
import { ApiManager, ApiResponse } from "./ApiManager.js";
import { FilterEngineCategories } from "./enums/QueryFilters.js";
import { Visibility } from "./enums/Visibility.js";
import { EIntermediateFile } from "./enums/EIntermediateFile.js";
import { UploaderStates, UploaderState } from "@storyteller/common";

export class MediaUploadApi extends ApiManager {
  private async Upload({
    endpoint,
    uuid,
    blob,
    fileName,
    options,
  }: {
    endpoint: string;
    blob: Blob | File;
    fileName: string;
    uuid: string;
    options: Record<string, string | number | undefined>;
  }): Promise<ApiResponse<string>> {
    const formRecord = Object.entries(options).reduce(
      (allOptions, [key, value]) => {
        if (value === undefined) {
          return allOptions;
        }
        return { ...allOptions, [key]: value.toString() };
      },
      {} as Record<string, string>,
    );

    return await this.postForm<{
      success: boolean;
      media_file_token?: string;
      BadInput?: string;
    }>({ endpoint, formRecord, blob, blobFileName: fileName, uuid })
      .then((response) => ({
        success: Boolean(response.success ?? false),
        data: response.media_file_token,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async UploadAudio({
    blob,
    fileName,
    uuid,
    maybe_title,
    maybe_visibility = Visibility.Public,
  }: {
    blob: Blob;
    fileName: string;
    uuid: string;
    maybe_title?: string | undefined;
    maybe_visibility?: Visibility | undefined;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/audio`;
    const options: Record<string, string | number | undefined> = {
      maybe_title,
      maybe_visibility: maybe_visibility?.toString(),
    };
    return this.Upload({ endpoint, blob, fileName, uuid, options });
  }

  public async UploadImage({
    blob,
    fileName,
    uuid,
    maybe_title,
    maybe_visibility = Visibility.Public,
    is_intermediate_system_file = EIntermediateFile.true
  }: {
    blob: Blob;
    fileName: string;
    uuid: string;
    maybe_title?: string | undefined;
    maybe_visibility?: Visibility | undefined;
    is_intermediate_system_file?: EIntermediateFile;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/image`;
    const options: Record<string, string | number | undefined> = {
      is_intermediate_system_file: EIntermediateFile[is_intermediate_system_file],
      maybe_title,
      maybe_visibility: maybe_visibility?.toString(),
    };
    return this.Upload({ endpoint, blob, fileName, uuid, options });
  }

  public async UploadNewEngineAsset({
    file,
    fileName,
    uuid,
    engine_category,
    maybe_animation_type,
    maybe_duration_millis,
    maybe_title,
    maybe_visibility = Visibility.Public,
  }: {
    file: File;
    fileName: string;
    uuid: string;
    engine_category: FilterEngineCategories;
    maybe_animation_type?: string;
    maybe_duration_millis?: number;
    maybe_title?: string;
    maybe_visibility?: Visibility;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/new_engine_asset`;
    const options: Record<string, string | number | undefined> = {
      engine_category,
      maybe_title,
      maybe_visibility: maybe_visibility?.toString(),
      maybe_animation_type,
      maybe_duration_millis,
    };
    return this.Upload({ endpoint, blob: file, fileName, uuid, options });
  }

  public async UploadSpzFile({
    file,
    fileName,
    uuid,
    maybe_title,
    maybe_visibility = Visibility.Public,
  }: {
    file: File;
    fileName: string;
    uuid: string;
    maybe_title?: string;
    maybe_visibility?: Visibility;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/spz`;
    const options: Record<string, string | number | undefined> = {
      maybe_title,
      maybe_visibility: maybe_visibility?.toString(),
    };
    return this.Upload({ endpoint, blob: file, fileName, uuid, options });
  }

  public async UploadNewScene({
    blob,
    fileName,
    uuid,
    maybe_title,
    maybe_visibility = Visibility.Public,
  }: {
    blob: Blob;
    fileName: string;
    uuid: string;
    maybe_title?: string;
    maybe_visibility?: Visibility;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/new_scene`;
    const options: Record<string, string | number | undefined> = {
      maybe_title,
      maybe_visibility: maybe_visibility?.toString(),
    };
    return this.Upload({ endpoint, blob, fileName, uuid, options });
  }

  public async UploadNewVideo({
    blob,
    fileName,
    uuid,
    maybe_title,
    maybe_visibility = Visibility.Public,
    maybe_style_name,
    maybe_scene_source_media_file_token,
    is_intermediate_system_file = EIntermediateFile.true,
  }: {
    blob: Blob;
    fileName: string;
    uuid: string;
    maybe_title?: string;
    maybe_visibility?: Visibility;
    maybe_style_name?: string;
    maybe_scene_source_media_file_token?: string;
    is_intermediate_system_file?: EIntermediateFile;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/new_video`;
    const options: Record<string, string | number | undefined> = {
      is_intermediate_system_file: EIntermediateFile[is_intermediate_system_file],
      maybe_title,
      maybe_visibility: maybe_visibility?.toString(),
      maybe_style_name,
      maybe_scene_source_media_file_token,
    };
    return this.Upload({ endpoint, blob, fileName, uuid, options });
  }

  public async UploadPmx({
    file,
    fileName,
    uuid,
    engine_category,
    maybe_animation_type,
    maybe_duration_millis,
    maybe_title,
    maybe_visibility = Visibility.Public,
  }: {
    file: File;
    fileName: string;
    uuid: string;
    engine_category?: string;
    maybe_animation_type?: string;
    maybe_duration_millis?: number;
    maybe_title?: string;
    maybe_visibility?: Visibility;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/pmx`;
    const options: Record<string, string | number | undefined> = {
      is_intermediate_system_file: "true",
      engine_category,
      maybe_animation_type,
      maybe_duration_millis,
      maybe_title,
      maybe_visibility,
    };
    return this.Upload({ endpoint, blob: file, fileName, uuid, options });
  }

  public async UploadSavedScene({
    blob,
    fileName,
    uuid,
    mediaToken,
  }: {
    blob: Blob;
    fileName: string;
    uuid: string;
    mediaToken: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/saved_scene/${mediaToken}`;
    const options: Record<string, string | number | undefined> = {};
    return this.Upload({ endpoint, blob, fileName, uuid, options });
  }

  // this is used to send the scene snapshot to the vst upload endpoint this creates a snapshot of the scene where in we can remix from the og.
  public async UploadSceneSnapshotMediaFileForm({
    blob,
    uuid,
    maybe_title, // title of the scene at the time
    maybe_scene_source_media_file_token, // original token that started it all
  }: {
    blob: Blob;
    uuid: string;
    maybe_title: string;
    maybe_scene_source_media_file_token: string | undefined;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/scene_snapshot`;

    const options: Record<string, string | number | undefined> = {
      maybe_title: maybe_title,
      maybe_scene_source_media_file_token: maybe_scene_source_media_file_token,
    };

    const fileName = `${maybe_title}-${uuid}`;
    return this.Upload({ endpoint, blob, fileName, uuid, options }); // token comes back and send it VST
  }
}

// --- Upload media helpers ---

const getFileName = (file: File) =>
  file.name.substring(0, file.name.lastIndexOf("."));

export type UploadMediaFn = (args: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => Promise<void>;

export const UploadImageMedia: UploadMediaFn = async ({
  title,
  assetFile,
  progressCallback,
}) => {
  const api = new MediaUploadApi();
  progressCallback({ status: UploaderStates.uploadingImage });

  const res = await api.UploadImage({
    uuid: uuidv4(),
    blob: assetFile,
    fileName: getFileName(assetFile),
    maybe_title: "char_frame_" + title,
    is_intermediate_system_file: EIntermediateFile.false,
  });

  if (!res?.success || !res.data) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: res?.errorMessage ?? "Could not upload image!",
    });
    return;
  }

  progressCallback({ status: UploaderStates.success, data: res.data });
};

export const UploadVideoMedia: UploadMediaFn = async ({
  title,
  assetFile,
  progressCallback,
}) => {
  const api = new MediaUploadApi();
  progressCallback({ status: UploaderStates.uploadingImage });

  const res = await api.UploadNewVideo({
    uuid: uuidv4(),
    blob: assetFile,
    fileName: getFileName(assetFile),
    maybe_title: "ref_video_" + title,
    is_intermediate_system_file: EIntermediateFile.false,
  });

  if (!res?.success || !res.data) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: res?.errorMessage ?? "Could not upload video!",
    });
    return;
  }

  progressCallback({ status: UploaderStates.success, data: res.data });
};

export const UploadAudioMedia: UploadMediaFn = async ({
  title,
  assetFile,
  progressCallback,
}) => {
  const api = new MediaUploadApi();
  progressCallback({ status: UploaderStates.uploadingImage });

  const res = await api.UploadAudio({
    uuid: uuidv4(),
    blob: assetFile,
    fileName: getFileName(assetFile),
    maybe_title: "ref_audio_" + title,
  });

  if (!res?.success || !res.data) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: res?.errorMessage ?? "Could not upload audio!",
    });
    return;
  }

  progressCallback({ status: UploaderStates.success, data: res.data });
};
