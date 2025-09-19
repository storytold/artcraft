import { ApiManager, ApiResponse } from './ApiManager.js';
import { FilterEngineCategories } from './enums/QueryFilters.js';
import { Visibility } from './enums/Visibility.js';
import { EIntermediateFile } from './enums/EIntermediateFile.js';
export declare class MediaUploadApi extends ApiManager {
    private sessionToken;
    private getSessionTokenForUploadStudioShot;
    UploadStudioShot({ maybe_title, uuid_idempotency_token, blob, fileName, maybe_visibility, }: {
        maybe_title?: string;
        uuid_idempotency_token: string;
        blob: Blob | null;
        fileName: string;
        maybe_visibility?: Visibility;
    }): Promise<ApiResponse<string>>;
    private Upload;
    UploadAudio({ blob, fileName, uuid, maybe_title, maybe_visibility, }: {
        blob: Blob;
        fileName: string;
        uuid: string;
        maybe_title?: string | undefined;
        maybe_visibility?: Visibility | undefined;
    }): Promise<ApiResponse<string>>;
    UploadImage({ blob, fileName, uuid, maybe_title, maybe_visibility, is_intermediate_system_file }: {
        blob: Blob;
        fileName: string;
        uuid: string;
        maybe_title?: string | undefined;
        maybe_visibility?: Visibility | undefined;
        is_intermediate_system_file?: EIntermediateFile;
    }): Promise<ApiResponse<string>>;
    UploadNewEngineAsset({ file, fileName, uuid, engine_category, maybe_animation_type, maybe_duration_millis, maybe_title, maybe_visibility, }: {
        file: File;
        fileName: string;
        uuid: string;
        engine_category: FilterEngineCategories;
        maybe_animation_type?: string;
        maybe_duration_millis?: number;
        maybe_title?: string;
        maybe_visibility?: Visibility;
    }): Promise<ApiResponse<string>>;
    UploadNewScene({ blob, fileName, uuid, maybe_title, maybe_visibility, }: {
        blob: Blob;
        fileName: string;
        uuid: string;
        maybe_title?: string;
        maybe_visibility?: Visibility;
    }): Promise<ApiResponse<string>>;
    UploadNewVideo({ blob, fileName, uuid, maybe_title, maybe_visibility, maybe_style_name, maybe_scene_source_media_file_token, }: {
        blob: Blob;
        fileName: string;
        uuid: string;
        maybe_title?: string;
        maybe_visibility?: Visibility;
        maybe_style_name?: string;
        maybe_scene_source_media_file_token?: string;
    }): Promise<ApiResponse<string>>;
    UploadPmx({ file, fileName, uuid, engine_category, maybe_animation_type, maybe_duration_millis, maybe_title, maybe_visibility, }: {
        file: File;
        fileName: string;
        uuid: string;
        engine_category?: string;
        maybe_animation_type?: string;
        maybe_duration_millis?: number;
        maybe_title?: string;
        maybe_visibility?: Visibility;
    }): Promise<ApiResponse<string>>;
    UploadSavedScene({ blob, fileName, uuid, mediaToken, }: {
        blob: Blob;
        fileName: string;
        uuid: string;
        mediaToken: string;
    }): Promise<ApiResponse<string>>;
    UploadSceneSnapshotMediaFileForm({ blob, uuid, maybe_title, // title of the scene at the time
    maybe_scene_source_media_file_token, }: {
        blob: Blob;
        uuid: string;
        maybe_title: string;
        maybe_scene_source_media_file_token: string | undefined;
    }): Promise<ApiResponse<string>>;
}
//# sourceMappingURL=MediaUploadApi.d.ts.map