import { MediaFilesApi } from "./MediaFilesApi.js";
import {
  FilterMediaClasses,
  FilterMediaType,
  FilterEngineCategories,
} from "./enums/QueryFilters.js";

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

export class GalleryModalApi extends MediaFilesApi {
  constructor() {
    super();
  }

  public async listUserMediaFiles(query: ListUserMediaQuery) {
    return await this.ListUserMediaFiles({
      ...query,
      filter_media_classes: query.filter_media_classes,
      filter_media_type: query.filter_media_type,
      filter_engine_categories: query.filter_engine_categories,
      username: query.username,
      user_uploads_only: query.user_uploads_only,
      include_user_uploads: query.include_user_uploads,
      page_index: query.page_index,
      page_size: query.page_size,
    });
  }
}
