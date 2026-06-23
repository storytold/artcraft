import { ApiManager, type ApiResponse } from "./ApiManager";

export interface Pagination {
  total_items: number;
  total_pages: number;
  current_page: number;
  items_per_page: number;
}

export interface ListUserMediaQuery {
  page_index?: number;
  page_size?: number;
  filter_media_classes?: string[];
  filter_media_type?: string[];
  filter_engine_categories?: string[];
}

export interface ListMediaFilesQuery {
  sort_ascending?: boolean;
  page_size?: number;
  cursor?: string;
  cursor_is_reversed?: boolean;
  filter_media_classes?: string;
  filter_media_type?: string;
  filter_engine_categories?: string;
  include_user_uploads?: boolean;
}

export interface CursorPagination {
  cursor_is_reversed: boolean;
  maybe_next: string | null;
  maybe_previous: string | null;
}

export interface ExploreMediaFile {
  token: string;
  media_class: string;
  media_type: string;
  created_at: string;
  updated_at: string;
  maybe_title: string | null;
  maybe_text_transcript: string | null;
  creator_set_visibility: string;
  is_user_upload: boolean;
  is_intermediate_system_file: boolean;
  media_links: {
    cdn_url: string;
    maybe_thumbnail_template: string | null;
    maybe_video_previews: {
      animated?: string;
      thumbnail_template?: string;
    } | null;
  };
  cover_image: {
    default_cover: {
      color_index: number;
      image_index: number;
    };
    maybe_cover_image_public_bucket_url: string | null;
    maybe_links: {
      cdn_url: string;
      maybe_thumbnail_template: string | null;
    } | null;
  };
  maybe_creator: {
    default_avatar: { color_index: number; image_index: number };
    display_name: string;
    gravatar_hash: string;
    user_token: string;
    username: string;
  } | null;
  maybe_duration_millis: number | null;
  maybe_engine_category: string | null;
  origin: {
    origin_category: string;
    product_category: string;
  };
  stats: {
    bookmark_count: number;
    positive_rating_count: number;
  };
}

export interface MediaInfo {
  token: string;
  media_class: string;
  media_type: string;
  public_bucket_url?: string;
  media_links?: {
    cdn_url?: string;
    maybe_thumbnail_template?: string;
    maybe_video_previews?: {
      animated?: string;
      thumbnail_template?: string;
    } | null;
  };
  maybe_title?: string;
  maybe_text_transcript?: string;
  created_at?: string;
  updated_at?: string;
  creator_set_visibility?: string;
  // include arbitrary keys
  [key: string]: any;
}

export function getMediaThumbnailUrl(
  item: MediaInfo | ExploreMediaFile,
  width = 512,
): string | undefined {
  const widthStr = width.toString();

  // Videos: use animated preview
  if (item.media_class === "video") {
    if (item.media_links?.maybe_video_previews?.animated) {
      return item.media_links.maybe_video_previews.animated;
    }
  }

  // 3D/dimensional: use cover image URL
  if (item.media_class === "dimensional") {
    if ("cover_image" in item && item.cover_image) {
      if (item.cover_image.maybe_cover_image_public_bucket_url) {
        return item.cover_image.maybe_cover_image_public_bucket_url;
      }
      if (item.cover_image.maybe_links?.maybe_thumbnail_template) {
        return item.cover_image.maybe_links.maybe_thumbnail_template.replace(
          "{WIDTH}",
          widthStr,
        );
      }
      if (item.cover_image.maybe_links?.cdn_url) {
        return item.cover_image.maybe_links.cdn_url;
      }
    }
  }

  // Images (and fallback): use thumbnail template
  if (item.media_links?.maybe_thumbnail_template) {
    return item.media_links.maybe_thumbnail_template.replace(
      "{WIDTH}",
      widthStr,
    );
  }

  if (item.media_links?.cdn_url) return item.media_links.cdn_url;
  if ("public_bucket_url" in item && item.public_bucket_url)
    return item.public_bucket_url as string;
  return undefined;
}

export interface MediaFileDetail {
  token: string;
  maybe_prompt_token: string | null;
  media_class: string;
  media_type: string;
  maybe_title: string | null;
  maybe_text_transcript: string | null;
  [key: string]: any;
}

export interface PromptInfo {
  token: string;
  maybe_model_type: string | null;
  maybe_model_class: string | null;
  maybe_positive_prompt: string | null;
  maybe_negative_prompt: string | null;
  maybe_aspect_ratio: string | null;
  maybe_resolution: string | null;
  maybe_generation_provider: string | null;
  maybe_generation_mode: string | null;
  maybe_duration_seconds: number | null;
  maybe_inference_duration_millis: number | null;
}

export class MediaApi extends ApiManager {
  public async ListMediaFiles(
    query: ListMediaFilesQuery = {},
  ): Promise<ApiResponse<ExploreMediaFile[], CursorPagination>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/list`;

    const queryParams: Record<string, string | number | boolean> = {};

    if (query.page_size !== undefined) queryParams.page_size = query.page_size;
    if (query.cursor) queryParams.cursor = query.cursor;
    if (query.sort_ascending !== undefined)
      queryParams.sort_ascending = query.sort_ascending;
    if (query.cursor_is_reversed !== undefined)
      queryParams.cursor_is_reversed = query.cursor_is_reversed;
    if (query.filter_media_classes)
      queryParams.filter_media_classes = query.filter_media_classes;
    if (query.filter_media_type)
      queryParams.filter_media_type = query.filter_media_type;
    if (query.filter_engine_categories)
      queryParams.filter_engine_categories = query.filter_engine_categories;
    if (query.include_user_uploads)
      queryParams.include_user_uploads = query.include_user_uploads;

    return await this.get<{
      success: boolean;
      results: ExploreMediaFile[];
      pagination: CursorPagination;
      error_message?: string;
    }>({ endpoint, query: queryParams })
      .then((response) => ({
        success: response.success,
        data: response.results ?? [],
        pagination: response.pagination,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListUserMediaFiles(
    username: string,
    query: ListUserMediaQuery = {},
  ): Promise<ApiResponse<MediaInfo[], Pagination>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/list/user/${username}`;

    // Convert to fully stringified dict
    const queryWithStrings: Record<string, string | number | boolean> = {
      include_user_uploads: true,
    };

    if (query.page_index !== undefined)
      queryWithStrings.page_index = query.page_index;
    if (query.page_size !== undefined)
      queryWithStrings.page_size = query.page_size;

    if (query.filter_media_classes) {
      queryWithStrings.filter_media_classes =
        query.filter_media_classes.join(",");
    }
    if (query.filter_media_type) {
      queryWithStrings.filter_media_type = query.filter_media_type.join(",");
    }
    if (query.filter_engine_categories) {
      queryWithStrings.filter_engine_categories =
        query.filter_engine_categories.join(",");
    }

    return await this.get<{
      success: boolean;
      results: MediaInfo[];
      pagination?: Pagination;
      error_message?: string;
    }>({ endpoint, query: queryWithStrings })
      .then((response) => ({
        success: response.success,
        data: response.results ?? [],
        pagination: response.pagination,
        errorMessage: response.error_message,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async GetMediaFile(
    token: string,
  ): Promise<ApiResponse<MediaFileDetail>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/file/${token}`;

    return await this.get<{
      success: boolean;
      media_file: MediaFileDetail;
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.media_file,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async GetPrompt(
    token: string,
  ): Promise<ApiResponse<PromptInfo>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/prompts/${token}`;

    return await this.get<{
      success: boolean;
      prompt: PromptInfo;
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.prompt,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }
}
