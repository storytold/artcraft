import { ApiManager, ApiResponse } from './ApiManager.js';
import { Weight } from './models/Weight.js';
import { Pagination, PaginationInfinite } from './models/Pagination.js';
import { FilterEngineCategories, FilterMediaClasses, FilterMediaType } from './enums/QueryFilters.js';
import { Visibility } from './enums/Visibility.js';
export declare enum ScopedWeightType {
    HIFIGAN_TT2 = "hifigan_tt2",
    RVC_V2 = "rvc_v2",
    SD_1_5 = "sd_1.5",
    SDXL = "sdxl",
    SO_VITS_SVC = "so_vits_svc",
    TT2 = "tt2",
    LORA = "loRA",
    VALL_E = "vall_e",
    COMFY_UI = "comfy_ui"
}
export declare enum ScopedWeightCategory {
    IMAGE_GENERATION = "image_generation",
    TEXT_TO_SPEECH = "text_to_speech",
    VOCODER = "vocoder",
    VOICE_CONVERSION = "voice_conversion",
    WORKFLOW_CONFIG = "workflow_config"
}
interface WeightsRequest {
    pageSize?: number;
    weightType?: ScopedWeightType[];
    weightCategory?: ScopedWeightCategory[];
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
export declare class WeightsApi extends ApiManager {
    ListWeightsByUser({ username, ...params }: ListWeightsByUserRequest): Promise<ApiResponse<Weight[], Pagination>>;
    ListWeights({ ...params }: ListWeightsRequest): Promise<ApiResponse<Weight[], PaginationInfinite>>;
    ListWeightsFeatured({ ...params }: ListFeaturedWeightsRequest): Promise<ApiResponse<Weight[], PaginationInfinite>>;
    ListWeightsPinned(): Promise<ApiResponse<Weight[]>>;
    SearchWeights(params: SearchWeightParams): Promise<ApiResponse<Weight[]>>;
    GetWeightByToken({ weightToken, }: {
        weightToken: string;
    }): Promise<ApiResponse<Weight>>;
    UpdateWeightByToken({ weightToken, ...params }: UpdateWeightByTokenParams): Promise<ApiResponse<undefined>>;
    DeleteWeightByToken({ weightToken, }: {
        weightToken: string;
    }): Promise<ApiResponse<undefined>>;
    UpdateWeightCoverImageByToken({ weightToken, coverImageMediaFileToken, }: {
        weightToken: string;
        coverImageMediaFileToken: string;
    }): Promise<ApiResponse<undefined>>;
}
export {};
//# sourceMappingURL=WeightsApi.d.ts.map