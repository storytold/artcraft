import { ApiManager, ApiResponse } from "./ApiManager.js";
import {
  UserBookmarkBatch,
  UserBookmarkByEntity,
  UserBookmarkByUser,
} from "./models/UserBookmark.js";
import { Pagination } from "./models/Pagination.js";

export enum ScopedEntityTypes {
  USER = "user",
  TTS_MODEL = "tts-model",
  TTS_RESULT = "tts-result",
  W2L_TEMPLATE = "w2l-template",
  W2L_RESULT = "w2l-result",
  MEDIA_FILE = "media_file",
  MODEL_WEIGHT = "model_weight",
  VOICE_CONVERSION_MODEL = "voice_conversion_model",
  ZS_VOICE = "z_voice",
}

export enum ScopedWeightTypes {
  HIFIGAN_TTl2 = "hifigan_tt2",
  RVC_V2 = "rvc_v2",
  SD_1_5 = "sd_1.5",
  SDXL = "sdxl",
  SO_VITS_SVC = "so_vits_svc",
  TT2 = "tt2",
  LORA = "loRA",
  VALL_E = "vall_e",
  COMFY_UI = "comfy_ui",
}

export enum ScopedMediaFileType {
  IMAGE_GENERATION = "image_generation",
  TEXT_TO_SPEECH = "text_to_speech",
  VOCODER = "vocoder",
  VOICE_CONVERSION = "voice_conversion",
  WORKFLOW_CONFIG = "workflow_config",
}

interface ListUserBookmarksByUserRequest {
  username: string;
  sort_ascending?: boolean;
  page_size?: number;
  page_index?: number;
  maybe_scoped_entity_type?: ScopedEntityTypes[];
  maybe_scoped_weight_type?: ScopedWeightTypes[];
  maybe_scoped_media_file_type?: ScopedMediaFileType[];
}

export class UserBookmarksApi extends ApiManager {
  public CreateUserBookmark({
    entityToken,
    entityType,
  }: {
    entityToken: string;
    entityType: string;
  }): Promise<
    ApiResponse<{
      new_bookmark_count_for_entity?: number;
      user_bookmark_token?: string;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/create`;
    const body = {
      entity_token: entityToken,
      entity_type: entityType,
    };

    return this.post<
      {
        entity_token: string;
        entity_type: string;
      },
      {
        success?: boolean;
        new_bookmark_count_for_entity?: number;
        user_bookmark_token: string;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        data: {
          new_bookmark_count_for_entity: response.new_bookmark_count_for_entity,
          user_bookmark_token: response.user_bookmark_token,
        },
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public DeleteUserBookmark({
    entityToken,
  }: {
    entityToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/delete/${entityToken}`;

    return this.delete<
      { as_mod: boolean },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body: { as_mod: true } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListUserBookmarks(): Promise<ApiResponse<UserBookmarkBatch[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/batch`;

    return this.get<{
      success?: boolean;
      bookmarks?: UserBookmarkBatch[];
      BadInput?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success ?? false,
        data: response.bookmarks,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListUserBookmarksByUser({
    username,
    sort_ascending,
    page_size,
    page_index,
    maybe_scoped_entity_type,
    maybe_scoped_weight_type,
    maybe_scoped_media_file_type,
  }: ListUserBookmarksByUserRequest): Promise<
    ApiResponse<UserBookmarkByUser[], Pagination>
  > {
    const user = username;
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/list/${user}`;

    const query = {
      sort_ascending,
      page_size,
      page_index,
      maybe_scoped_entity_type: maybe_scoped_entity_type
        ? maybe_scoped_entity_type.join(",")
        : undefined,
      maybe_scoped_weight_type: maybe_scoped_weight_type
        ? maybe_scoped_weight_type.join(",")
        : undefined,
      maybe_scoped_media_file_type: maybe_scoped_media_file_type
        ? maybe_scoped_media_file_type.join(",")
        : undefined,
    };

    return this.get<{
      success?: boolean;
      pagination?: Pagination;
      results: UserBookmarkByUser[];
    }>({ endpoint, query })
      .then((response) => ({
        success: response.success ?? false,
        data: response.results,
        pagination: response.pagination,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListUserBookmarksByEntity({
    entityType,
    entityToken,
  }: {
    entityType: string;
    entityToken: string;
  }): Promise<ApiResponse<UserBookmarkByEntity[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/list/${entityType}/${entityToken}`;

    return this.get<{
      success: boolean;
      user_bookmarks: UserBookmarkByEntity[];
    }>({ endpoint })
      .then((response) => ({
        success: true,
        data: response.user_bookmarks,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
