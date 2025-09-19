import { ApiManager, ApiResponse } from './ApiManager.js';
import { UserBookmarkBatch, UserBookmarkByEntity, UserBookmarkByUser } from './models/UserBookmark.js';
import { Pagination } from './models/Pagination.js';
export declare enum ScopedEntityTypes {
    USER = "user",
    TTS_MODEL = "tts-model",
    TTS_RESULT = "tts-result",
    W2L_TEMPLATE = "w2l-template",
    W2L_RESULT = "w2l-result",
    MEDIA_FILE = "media_file",
    MODEL_WEIGHT = "model_weight",
    VOICE_CONVERSION_MODEL = "voice_conversion_model",
    ZS_VOICE = "z_voice"
}
export declare enum ScopedWeightTypes {
    HIFIGAN_TTl2 = "hifigan_tt2",
    RVC_V2 = "rvc_v2",
    SD_1_5 = "sd_1.5",
    SDXL = "sdxl",
    SO_VITS_SVC = "so_vits_svc",
    TT2 = "tt2",
    LORA = "loRA",
    VALL_E = "vall_e",
    COMFY_UI = "comfy_ui"
}
export declare enum ScopedMediaFileType {
    IMAGE_GENERATION = "image_generation",
    TEXT_TO_SPEECH = "text_to_speech",
    VOCODER = "vocoder",
    VOICE_CONVERSION = "voice_conversion",
    WORKFLOW_CONFIG = "workflow_config"
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
export declare class UserBookmarksApi extends ApiManager {
    CreateUserBookmark({ entityToken, entityType, }: {
        entityToken: string;
        entityType: string;
    }): Promise<ApiResponse<{
        new_bookmark_count_for_entity?: number;
        user_bookmark_token?: string;
    }>>;
    DeleteUserBookmark({ entityToken, }: {
        entityToken: string;
    }): Promise<ApiResponse<undefined>>;
    ListUserBookmarks(): Promise<ApiResponse<UserBookmarkBatch[]>>;
    ListUserBookmarksByUser({ username, sort_ascending, page_size, page_index, maybe_scoped_entity_type, maybe_scoped_weight_type, maybe_scoped_media_file_type, }: ListUserBookmarksByUserRequest): Promise<ApiResponse<UserBookmarkByUser[], Pagination>>;
    ListUserBookmarksByEntity({ entityType, entityToken, }: {
        entityType: string;
        entityToken: string;
    }): Promise<ApiResponse<UserBookmarkByEntity[]>>;
}
export {};
//# sourceMappingURL=UserBookmarksApi.d.ts.map