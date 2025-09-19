import { ApiManager, ApiResponse } from "./ApiManager.js";
import { FilterEngineCategories } from "./enums/QueryFilters.js";
import { Visibility } from "./enums/Visibility.js";
import { EIntermediateFile } from "./enums/EIntermediateFile.js";
export class MediaUploadApi extends ApiManager {
  private sessionToken = "";

  private async getSessionTokenForUploadStudioShot() {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/session_token`;
    return await this.get<{
      maybe_signed_session: string;
    }>({ endpoint })
      .then((response) => {
        return {
          success: true,
          data: response["maybe_signed_session"],
        };
      })
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async UploadStudioShot({
    maybe_title,
    uuid_idempotency_token,
    blob,
    fileName,
    maybe_visibility,
  }: {
    maybe_title?: string;
    uuid_idempotency_token: string;
    blob: Blob | null;
    fileName: string;
    maybe_visibility?: Visibility;
  }): Promise<ApiResponse<string>> {
    // This function is a bit special it requires that
    const endpoint = `${this.ApiTargets.uploadApi}/v1/media_files/upload/studio_shot`;

    if (!this.sessionToken) {
      console.log("Session Token");
      const response = await this.getSessionTokenForUploadStudioShot();
      if (response.success && response.data) {
        this.sessionToken = response.data;
        console.log(`Token ${this.sessionToken}`);
      } else {
        return {
          success: false,
          errorMessage: "Could not obtain session tokens.",
        };
      }
    } else {
      console.log(`Session Token: ${this.sessionToken}`);
    }

    const options: Record<string, string | number | undefined> = {
      maybe_title,
      maybe_frame_rate_fps: 60,
      maybe_visibility: maybe_visibility?.toString(),
    };

    const formRecord = Object.entries(options).reduce(
      (allOptions, [key, value]) => {
        if (value === undefined) {
          return allOptions;
        }
        return { ...allOptions, [key]: value.toString() };
      },
      {} as Record<string, string>,
    );

    const formData = new FormData();
    formData.append("uuid_idempotency_token", uuid_idempotency_token);
    Object.entries(formRecord).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (blob && fileName) {
      formData.append("file", blob, fileName);
    } else if (blob) {
      formData.append("file", blob);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Session: this.sessionToken,
      },
      credentials: "include",
      body: formData,
    });

    const result = await response.json();

    if (result.success && result.media_file_token) {
      return { success: true, data: result.media_file_token };
    } else {
      return { success: false, errorMessage: "Failed to Get Media Token" };
    }
  }

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
  }: {
    blob: Blob;
    fileName: string;
    uuid: string;
    maybe_title?: string;
    maybe_visibility?: Visibility;
    maybe_style_name?: string;
    maybe_scene_source_media_file_token?: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/new_video`;
    const options: Record<string, string | number | undefined> = {
      is_intermediate_system_file: "true",
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


