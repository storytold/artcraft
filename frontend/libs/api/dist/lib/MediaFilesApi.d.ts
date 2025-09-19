import { MediaFile } from './models/MediaFile.js';
import { Pagination, PaginationInfinite } from './models/Pagination.js';
import { ApiManager, ApiResponse } from './ApiManager.js';
import { Visibility } from './enums/Visibility.js';
import { FilterEngineCategories, FilterMediaClasses, FilterMediaType } from './enums/QueryFilters.js';
interface ListMediaQuery {
    sort_ascending?: boolean;
    page_size?: number;
    cursor?: string;
    cursor_is_reversed?: boolean;
    filter_media_classes?: FilterMediaClasses[];
    filter_media_type?: FilterMediaType[];
    filter_engine_categories?: FilterEngineCategories[];
}
interface ListUserMediaQuery {
    username: string;
    sort_ascending?: boolean;
    page_size?: number;
    page_index?: number;
    filter_media_classes?: FilterMediaClasses[];
    filter_media_type?: FilterMediaType[];
    filter_engine_categories?: FilterEngineCategories[];
    user_uploads_only?: boolean;
    include_user_uploads?: boolean;
}
interface SearchFeaturedMediaQuery {
    search_term: string;
    filter_media_classes?: FilterMediaClasses[];
    filter_media_type?: FilterMediaType[];
    filter_engine_categories?: FilterEngineCategories[];
}
export declare class MediaFilesApi extends ApiManager {
    DeleteMediaFileByToken({ mediaFileToken, asMod, setDelete, }: {
        mediaFileToken: string;
        asMod?: boolean;
        setDelete?: boolean;
    }): Promise<ApiResponse<MediaFile>>;
    ListMediaFilesByTokens({ mediaTokens, }: {
        mediaTokens: string[];
    }): Promise<ApiResponse<MediaFile[]>>;
    GetMediaFileByToken({ mediaFileToken, }: {
        mediaFileToken: string;
    }): Promise<ApiResponse<MediaFile>>;
    ListMediaFiles(query: ListMediaQuery): Promise<ApiResponse<MediaFile[], PaginationInfinite>>;
    ListFeaturedMediaFiles(query: ListMediaQuery): Promise<ApiResponse<MediaFile[], PaginationInfinite>>;
    ListUserMediaFiles(query: ListUserMediaQuery): Promise<ApiResponse<MediaFile[], Pagination>>;
    SearchFeaturedMediaFiles(query: SearchFeaturedMediaQuery): Promise<ApiResponse<MediaFile[], Pagination>>;
    SearchUserMediaFiles(query: SearchFeaturedMediaQuery): Promise<ApiResponse<MediaFile[], Pagination>>;
    RenameMediaFileByToken({ mediaToken, name, }: {
        mediaToken: string;
        name: string;
    }): Promise<ApiResponse<undefined>>;
    UpdateCoverImage({ mediaFileToken, imageToken, }: {
        mediaFileToken: string;
        imageToken: string;
    }): Promise<ApiResponse<undefined>>;
    UpdateVisibility({ mediaFileToken, visibility, }: {
        mediaFileToken: string;
        visibility: Visibility;
    }): Promise<ApiResponse<undefined>>;
}
export {};
//# sourceMappingURL=MediaFilesApi.d.ts.map