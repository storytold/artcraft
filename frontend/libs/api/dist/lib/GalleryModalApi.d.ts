import { MediaFilesApi } from './MediaFilesApi.js';
import { FilterMediaClasses, FilterMediaType, FilterEngineCategories } from './enums/QueryFilters.js';
interface ListUserMediaQuery {
    username: string;
    filter_media_classes?: FilterMediaClasses[];
    filter_media_type?: FilterMediaType[];
    filter_engine_categories?: FilterEngineCategories[];
    user_uploads_only?: boolean;
    include_user_uploads?: boolean;
    page_index?: number;
    page_size?: number;
}
export declare class GalleryModalApi extends MediaFilesApi {
    constructor();
    listUserMediaFiles(query: ListUserMediaQuery): Promise<import('./ApiManager.js').ApiResponse<import('./models/MediaFile.js').MediaFile[], import('./models/Pagination.js').Pagination>>;
}
export {};
//# sourceMappingURL=GalleryModalApi.d.ts.map