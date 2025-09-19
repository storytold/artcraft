import { ApiManager, ApiResponse } from "./ApiManager.js";
import { Weight } from "./models/Weight.js";
import { Pagination, PaginationInfinite } from "./models/Pagination.js";
import {
  FilterEngineCategories,
  FilterMediaClasses,
  FilterMediaType,
} from "./enums/QueryFilters.js";
import { Visibility } from "./enums/Visibility.js";

export enum ScopedWeightType {
  HIFIGAN_TT2 = "hifigan_tt2",
  RVC_V2 = "rvc_v2",
  SD_1_5 = "sd_1.5",
  SDXL = "sdxl",
  SO_VITS_SVC = "so_vits_svc",
  TT2 = "tt2",
  LORA = "loRA",
  VALL_E = "vall_e",
  COMFY_UI = "comfy_ui",
}
export enum ScopedWeightCategory {
  IMAGE_GENERATION = "image_generation",
  TEXT_TO_SPEECH = "text_to_speech",
  VOCODER = "vocoder",
  VOICE_CONVERSION = "voice_conversion",
  WORKFLOW_CONFIG = "workflow_config",
}

interface WeightsRequest {
  pageSize?: number;
  weightType?: ScopedWeightType[];
  weightCategory?: ScopedWeightCategory[];
  //TODO: what is scoped??
  scopedWeightType?: ScopedWeightType[];
  scopedWeightCategory?: ScopedWeightCategory[];
}

export interface ListWeightsByUserRequest extends WeightsRequest {
  username: string;
  pageIndex?: number;
  sortAscending?: boolean;
}

export interface ListWeightsRequest extends WeightsRequest {
  cursor?: string;
  cursorIsReversed?: boolean;
}

export interface ListFeaturedWeightsRequest {
  sortAscending?: boolean;
  pageSize?: number;
  cursor?: string;
  cursorIsReversed?: boolean;
  filterMediaClasses?: FilterMediaClasses[];
  filterMediaType?: FilterMediaType[];
  filterEngineCategories?: FilterEngineCategories[];
}

export interface SearchWeightParams {
  ietfLanguageSubtag: string;
  searchTerm: string;
  weightCategory: ScopedWeightCategory;
  weightType: ScopedWeightType;
}

export interface SearchWeightRequest {
  ietf_language_subtag: string;
  search_term: string;
  weight_category: string;
  weight_type: string;
}

interface GetWeightByTokenResponse extends Weight {
  success: boolean;
}

export interface UpdateWeightByTokenParams {
  weightToken: string;
  coverImageMediaFileToken: string;
  descriptionMarkdown: string;
  title: string;
  visibility: Visibility;
}
export interface UpdateWeightByTokenRequest {
  cover_image_media_file_token: string;
  description_markdown: string;
  title: string;
  visibility: Visibility;
}

export class WeightsApi extends ApiManager {
  public ListWeightsByUser({
    username,
    ...params
  }: ListWeightsByUserRequest): Promise<ApiResponse<Weight[], Pagination>> {
    const user = username;
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/by_user/${user}`;

    const query = this.parseQueryValues(params);

    return this.get<{
      success: boolean;
      results: Weight[];
      pagination: Pagination;
    }>({ endpoint, query })
      .then((response) => ({
        success: true,
        data: response.results,
        pagination: response.pagination,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListWeights({
    ...params
  }: ListWeightsRequest): Promise<ApiResponse<Weight[], PaginationInfinite>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/list`;

    const query = this.parseQueryValues(params);

    return this.get<{
      success: boolean;
      results: Weight[];
      pagination: PaginationInfinite;
    }>({ endpoint, query })
      .then((response) => ({
        success: true,
        data: response.results,
        pagination: response.pagination,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListWeightsFeatured({
    ...params
  }: ListFeaturedWeightsRequest): Promise<
    ApiResponse<Weight[], PaginationInfinite>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/list_featured`;

    const query = this.parseQueryValues(params);

    return this.get<{
      success: boolean;
      results: Weight[];
      pagination: PaginationInfinite;
    }>({ endpoint, query })
      .then((response) => ({
        success: true,
        data: response.results,
        pagination: response.pagination,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListWeightsPinned(): Promise<ApiResponse<Weight[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/list_pinned`;

    return this.get<{
      success: boolean;
      results: Weight[];
    }>({ endpoint })
      .then((response) => ({
        success: true,
        data: response.results,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public SearchWeights(
    params: SearchWeightParams,
  ): Promise<ApiResponse<Weight[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/search`;

    const body = this.parseBodyValues<SearchWeightParams, SearchWeightRequest>(
      params,
    );

    return this.post<
      SearchWeightRequest,
      {
        success: boolean;
        weights: Weight[];
      }
    >({ endpoint, body })
      .then((response) => ({
        success: true,
        data: response.weights,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public GetWeightByToken({
    weightToken,
  }: {
    weightToken: string;
  }): Promise<ApiResponse<Weight>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/weight/${weightToken}`;

    return this.get<GetWeightByTokenResponse>({ endpoint })
      .then(({ success, ...mediaFile }) => ({
        success: success,
        data: mediaFile,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public UpdateWeightByToken({
    weightToken,
    ...params
  }: UpdateWeightByTokenParams): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/weight/${weightToken}`;

    const body = this.parseBodyValues<
      Omit<UpdateWeightByTokenParams, "weightToken">,
      UpdateWeightByTokenRequest
    >(params);

    return this.post<
      UpdateWeightByTokenRequest,
      { success?: boolean; BadInput?: string }
    >({ endpoint, body })
      .then(({ success, BadInput }) => ({
        success: success ?? false,
        errorMessage: BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public DeleteWeightByToken({
    weightToken,
  }: {
    weightToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/weight/${weightToken}`;

    const body = {
      as_mod: true,
      set_delete: true,
    };

    return this.delete<
      { as_mod: boolean; set_delete: boolean },
      { success?: boolean; BadInput?: string }
    >({ endpoint, body })
      .then(({ success, BadInput }) => ({
        success: success ?? false,
        errorMessage: BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public UpdateWeightCoverImageByToken({
    weightToken,
    coverImageMediaFileToken,
  }: {
    weightToken: string;
    coverImageMediaFileToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/weights/${weightToken}/cover_image`;

    const body = {
      cover_image_media_file_token: coverImageMediaFileToken,
    };

    return this.post<
      { cover_image_media_file_token: string },
      { success?: boolean; BadInput?: string }
    >({ endpoint, body })
      .then(({ success, BadInput }) => ({
        success: success ?? false,
        errorMessage: BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
