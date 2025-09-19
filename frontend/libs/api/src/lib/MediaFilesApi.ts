import { MediaFile } from "./models/MediaFile.js";
import { Pagination, PaginationInfinite } from "./models/Pagination.js";
import { ApiManager, ApiResponse } from "./ApiManager.js";
import { Visibility } from "./enums/Visibility.js";

import {
  FilterEngineCategories,
  FilterMediaClasses,
  FilterMediaType,
} from "./enums/QueryFilters.js";

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

export class MediaFilesApi extends ApiManager {
  public async DeleteMediaFileByToken({
    mediaFileToken,
    asMod = true,
    setDelete = true,
  }: {
    mediaFileToken: string;
    asMod?: boolean;
    setDelete?: boolean;
  }): Promise<ApiResponse<MediaFile>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/file/${mediaFileToken}`;

    const body = { as_mod: asMod, set_delete: setDelete };
    return await this.delete<
      {
        as_mod: boolean;
        set_delete: boolean;
      },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async ListMediaFilesByTokens({
    mediaTokens,
  }: {
    mediaTokens: string[];
  }): Promise<ApiResponse<MediaFile[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/batch`;

    return await this.get<{
      success: boolean;
      media_files: MediaFile[];
      error_reason?: string;
    }>({ endpoint, query: { tokens: mediaTokens.join(",") } })
      .then((response) => ({
        success: response.success,
        data: response.media_files,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public async GetMediaFileByToken({
    mediaFileToken,
  }: {
    mediaFileToken: string;
  }): Promise<ApiResponse<MediaFile>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/file/${mediaFileToken}`;
    return await this.get<{
      success: boolean;
      media_file: MediaFile;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.media_file,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async ListMediaFiles(
    query: ListMediaQuery
  ): Promise<ApiResponse<MediaFile[], PaginationInfinite>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/list`;
    const queryWithStrings = {
      ...query,
      filter_media_classes: query.filter_media_classes
        ? query.filter_media_classes.join(",")
        : undefined,
      filter_media_type: query.filter_media_type
        ? query.filter_media_type.join(",")
        : undefined,
      filter_engine_categories: query.filter_engine_categories
        ? query.filter_engine_categories.join(",")
        : undefined,
    };
    return await this.get<{
      success: boolean;
      results: MediaFile[];
      pagination?: PaginationInfinite;
    }>({ endpoint, query: queryWithStrings })
      .then((response) => ({
        success: response.success,
        data: response.results ?? [],
        pagination: response.pagination,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async ListFeaturedMediaFiles(
    query: ListMediaQuery
  ): Promise<ApiResponse<MediaFile[], PaginationInfinite>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/list_featured`;
    const queryWithStrings = {
      ...query,
      filter_media_classes: query.filter_media_classes
        ? query.filter_media_classes.join(",")
        : undefined,
      filter_media_type: query.filter_media_type
        ? query.filter_media_type.join(",")
        : undefined,
      filter_engine_categories: query.filter_engine_categories
        ? query.filter_engine_categories.join(",")
        : undefined,
    };
    return await this.get<{
      success: boolean;
      results: MediaFile[];
      pagination: PaginationInfinite;
    }>({ endpoint, query: queryWithStrings })
      .then((response) => ({
        success: true,
        data: response.results,
        pagination: response.pagination,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async ListUserMediaFiles(
    query: ListUserMediaQuery
  ): Promise<ApiResponse<MediaFile[], Pagination>> {
    const userName = query.username;
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/list/user/${userName}`;
    const queryWithStrings = {
      ...query,
      include_user_uploads: query.include_user_uploads,
      filter_media_classes: query.filter_media_classes
        ? query.filter_media_classes.join(",")
        : undefined,
      filter_media_type: query.filter_media_type
        ? query.filter_media_type.join(",")
        : undefined,
      filter_engine_categories: query.filter_engine_categories
        ? query.filter_engine_categories.join(",")
        : undefined,
    };
    return await this.get<{
      success: boolean;
      results: MediaFile[];
      pagination?: Pagination;
    }>({ endpoint, query: queryWithStrings })
      .then((response) => {
        let results = response.results ?? [];
        if (query.user_uploads_only) {
          results = results.filter((file) => file.origin_category === "upload");
        }
        return {
          success: response.success,
          data: results,
          pagination: response.pagination,
        };
      })
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async SearchFeaturedMediaFiles(
    query: SearchFeaturedMediaQuery
  ): Promise<ApiResponse<MediaFile[], Pagination>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/search_featured`;
    const queryWithStrings = {
      search_term: query.search_term,
      filter_media_classes: query.filter_media_classes
        ? query.filter_media_classes.join(",")
        : undefined,
      filter_media_type: query.filter_media_type
        ? query.filter_media_type.join(",")
        : undefined,
      filter_engine_categories: query.filter_engine_categories
        ? query.filter_engine_categories.join(",")
        : undefined,
    };
    return await this.get<{
      success: boolean;
      results: MediaFile[];
      pagination: Pagination;
    }>({ endpoint, query: queryWithStrings })
      .then((response) => ({
        success: true,
        data: response.results,
        pagination: response.pagination,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async SearchUserMediaFiles(
    query: SearchFeaturedMediaQuery
  ): Promise<ApiResponse<MediaFile[], Pagination>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/search_session`;
    const queryWithStrings = {
      search_term: query.search_term,
      filter_media_classes: query.filter_media_classes
        ? query.filter_media_classes.join(",")
        : undefined,
      filter_media_type: query.filter_media_type
        ? query.filter_media_type.join(",")
        : undefined,
      filter_engine_categories: query.filter_engine_categories
        ? query.filter_engine_categories.join(",")
        : undefined,
    };
    return await this.get<{
      success: boolean;
      results: MediaFile[];
      pagination: Pagination;
    }>({ endpoint, query: queryWithStrings })
      .then((response) => ({
        success: true,
        data: response.results,
        pagination: response.pagination,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async RenameMediaFileByToken({
    mediaToken,
    name,
  }: {
    mediaToken: string;
    name: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/rename/${mediaToken}`;
    const body = { name };

    return await this.post<
      { name: string },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public async UpdateCoverImage({
    mediaFileToken,
    imageToken,
  }: {
    mediaFileToken: string;
    imageToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/cover_image/${mediaFileToken}`;
    return await this.post<
      { cover_image_media_file_token: string },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body: { cover_image_media_file_token: imageToken } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async UpdateVisibility({
    mediaFileToken,
    visibility,
  }: {
    mediaFileToken: string;
    visibility: Visibility;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/visibility/${mediaFileToken}`;
    return await this.post<
      { creator_set_visibility: string },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body: { creator_set_visibility: visibility } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }
}
