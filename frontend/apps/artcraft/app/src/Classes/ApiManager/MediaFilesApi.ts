import type {
  MediaFile,
  MediaInfo,
  Pagination,
  PaginationInfinite,
} from "@storyteller/ui-pagescene";
import { ApiManager, ApiResponse } from "./ApiManager";
import { authentication } from "~/signals";
import type { Property } from "csstype";
import { Visibility } from "~/enums";

import {
  FilterEngineCategories,
  FilterMediaClasses,
  FilterMediaType,
} from "~/enums";

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
  sort_ascending?: boolean;
  page_size?: number;
  page_index?: number;
  filter_media_classes?: FilterMediaClasses[];
  filter_media_type?: FilterMediaType[];
  filter_engine_categories?: FilterEngineCategories[];
}

interface SearchFeaturedMediaQuery {
  search_term: string;
  filter_media_classes?: FilterMediaClasses[];
  filter_media_type?: FilterMediaType[];
  filter_engine_categories?: FilterEngineCategories[];
}

export class MediaFilesApi extends ApiManager {

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
    query: ListMediaQuery,
  ): Promise<ApiResponse<MediaInfo[], PaginationInfinite>> {
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
      results: MediaInfo[];
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
    query: ListMediaQuery,
  ): Promise<ApiResponse<MediaInfo[], PaginationInfinite>> {
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
      results: MediaInfo[];
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
    query: ListUserMediaQuery,
  ): Promise<ApiResponse<MediaInfo[], Pagination>> {
    const userName = authentication.userInfo.value?.username;
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/list/user/${userName}`;
    const queryWithStrings = {
      ...query,
      include_user_uploads: true,
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
      results: MediaInfo[];
      pagination?: Pagination;
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

  public async SearchFeaturedMediaFiles(
    query: SearchFeaturedMediaQuery,
  ): Promise<ApiResponse<MediaInfo[], Pagination>> {
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
      results: MediaInfo[];
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
    query: SearchFeaturedMediaQuery,
  ): Promise<ApiResponse<MediaInfo[], Pagination>> {
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
      results: MediaInfo[];
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

  public async UploadSpzFile({
    file,
    fileName,
    uuid,
    maybe_title,
    maybe_visibility = Visibility.Public,
  }: {
    file: File;
    fileName: string;
    uuid: string;
    maybe_title?: string;
    maybe_visibility?: Visibility;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/spz`;
    const options: Record<string, string | number | undefined> = {
      maybe_title,
      maybe_visibility: maybe_visibility?.toString(),
    };
    return this.Upload({ endpoint, blob: file, fileName, uuid, options });
  }

  private async Upload({
    endpoint,
    uuid,
    blob,
    fileName,
    options,
  }: {
    endpoint: string;
    blob: Blob | File;
    fileName: string;
    uuid: string;
    options: Record<string, string | number | undefined>;
  }): Promise<ApiResponse<string>> {
    const formRecord = Object.entries(options).reduce(
      (allOptions, [key, value]) => {
        if (value === undefined) {
          return allOptions;
        }
        return { ...allOptions, [key]: value.toString() };
      },
      {} as Record<string, string>,
    );

    return await this.postForm<{
      success: boolean;
      media_file_token?: string;
      BadInput?: string;
    }>({ endpoint, formRecord, blob, blobFileName: fileName, uuid })
      .then((response) => ({
        success: Boolean(response.success ?? false),
        data: response.media_file_token,
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
