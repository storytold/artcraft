import { ApiManager, ApiResponse } from "./ApiManager.js";
import { MediaLinks, MediaFileCoverImageDetails } from "./models/Folder.js";

// ─── Types ─────────────────────────────────────────────────────────────────

/** One tag as returned by every tags endpoint. */
export interface TagDetails {
  tag_token: string;
  /** The display value of the tag, as entered by its creator. */
  tag_value: string;
  /** Lowercased form of `tag_value` — the tag's unique key per account. */
  tag_value_lowercase: string;
  /** Rollup statistic: how many media files currently carry this tag. */
  use_count: number;
}

/** One media-file row from the tag-scoped media listings. */
export interface TagMediaFileListItem {
  token: string;
  media_class: string;
  media_type: string;
  maybe_prompt_token?: string | null;
  maybe_batch_token?: string | null;
  media_links: MediaLinks;
  cover_image?: MediaFileCoverImageDetails;
  maybe_title?: string | null;
  maybe_original_filename?: string | null;
  maybe_frame_width?: number | null;
  maybe_frame_height?: number | null;
  maybe_duration_millis?: number | null;
  creator_set_visibility?: string;
  is_user_upload?: boolean;
  created_at: string;
  updated_at: string;
}

/** Per-file tag lookup entry from `BulkListMediaFileTags`. */
export interface MediaFileTagsEntry {
  media_file_token: string;
  tags: TagDetails[];
}

/** Opaque cursor returned by the paged list endpoints; pass back as `cursor`. */
export interface TagsCursor {
  maybe_cursor?: string | null;
}

/** Cursor-based paging shared by the tags list endpoints. */
export interface ListTagsQuery {
  cursor?: string;
  limit?: number;
}

// ─── API ───────────────────────────────────────────────────────────────────

/**
 * Client for the `/v1/tags/*` endpoints (the rebuilt tags system).
 *
 * Tags are per-user, case-insensitively unique on their lowercased value.
 * Tag text sent to add/set endpoints is trimmed and deduped server-side;
 * empty entries are dropped. Paging is cursor based — pass the previous
 * response's `maybe_cursor` back as `cursor`.
 */
export class TagsApi extends ApiManager {
  // ── The user's tags ───────────────────────────────────────────────────────

  /** List the logged-in user's tags, newest first. */
  public ListTags(
    query: ListTagsQuery = {},
  ): Promise<ApiResponse<TagDetails[], TagsCursor>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/list`;
    return this.get<{
      success: boolean;
      tags: TagDetails[];
      maybe_cursor?: string | null;
    }>({ endpoint, query: { ...query } })
      .then((response) => ({
        success: response.success,
        data: response.tags ?? [],
        pagination: { maybe_cursor: response.maybe_cursor },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Rename a tag (case-only changes and wholesale renames are both allowed).
   * Fails if the user already has a different tag with the same lowercased
   * value.
   */
  public RenameTag({
    tagToken,
    newTagValue,
  }: {
    tagToken: string;
    newTagValue: string;
  }): Promise<ApiResponse<TagDetails>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/rename/${tagToken}`;
    return this.put<
      { new_tag_value: string },
      { success: boolean; tag: TagDetails }
    >({ endpoint, body: { new_tag_value: newTagValue } })
      .then((response) => ({
        success: response.success,
        data: response.tag,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Delete a tag. Its media-file links are removed along with it; returns
   * how many links were removed.
   */
  public DeleteTag({
    tagToken,
  }: {
    tagToken: string;
  }): Promise<ApiResponse<{ removed_link_count: number }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/${tagToken}`;
    return this.delete<
      Record<string, never>,
      { success: boolean; removed_link_count: number }
    >({ endpoint, body: {} })
      .then((response) => ({
        success: response.success,
        data: { removed_link_count: response.removed_link_count },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // ── Tagging many media files at once ─────────────────────────────────────

  /**
   * Add tags to many media files. Tokens the user doesn't own (or that are
   * deleted) are silently skipped; the response lists the accepted subset.
   */
  public BulkAddTags({
    mediaFileTokens,
    tags,
  }: {
    mediaFileTokens: string[];
    tags: string[];
  }): Promise<
    ApiResponse<{ accepted_media_file_tokens: string[]; tags: TagDetails[] }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/bulk_add`;
    return this.post<
      { media_file_tokens: string[]; maybe_tags_list: string[] },
      {
        success: boolean;
        accepted_media_file_tokens: string[];
        tags: TagDetails[];
      }
    >({
      endpoint,
      body: { media_file_tokens: mediaFileTokens, maybe_tags_list: tags },
    })
      .then((response) => ({
        success: response.success,
        data: {
          accepted_media_file_tokens: response.accepted_media_file_tokens,
          tags: response.tags,
        },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Replace the full tag set on many media files. An empty `tags` list is
   * allowed — it clears all tags from the listed files.
   */
  public BulkSetTags({
    mediaFileTokens,
    tags,
  }: {
    mediaFileTokens: string[];
    tags: string[];
  }): Promise<
    ApiResponse<{
      accepted_media_file_tokens: string[];
      tags: TagDetails[];
      removed_count: number;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/bulk_set`;
    return this.post<
      { media_file_tokens: string[]; maybe_tags_list: string[] },
      {
        success: boolean;
        accepted_media_file_tokens: string[];
        tags: TagDetails[];
        removed_count: number;
      }
    >({
      endpoint,
      body: { media_file_tokens: mediaFileTokens, maybe_tags_list: tags },
    })
      .then((response) => ({
        success: response.success,
        data: {
          accepted_media_file_tokens: response.accepted_media_file_tokens,
          tags: response.tags,
          removed_count: response.removed_count,
        },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // ── Tag operations on a single media file ────────────────────────────────

  /** All (live) tags on a media file, sorted by tag value. */
  public ListMediaFileTags({
    mediaFileToken,
  }: {
    mediaFileToken: string;
  }): Promise<ApiResponse<TagDetails[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/media_file/list/${mediaFileToken}`;
    return this.get<{ success: boolean; tags: TagDetails[] }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.tags ?? [],
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /** Add tags to a media file. Tags already on the file are absorbed. */
  public AddMediaFileTags({
    mediaFileToken,
    tags,
  }: {
    mediaFileToken: string;
    tags: string[];
  }): Promise<ApiResponse<TagDetails[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/media_file/add/${mediaFileToken}`;
    return this.post<
      { maybe_tags_list: string[] },
      { success: boolean; tags: TagDetails[] }
    >({ endpoint, body: { maybe_tags_list: tags } })
      .then((response) => ({
        success: response.success,
        data: response.tags ?? [],
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Replace the full tag set on a media file. An empty `tags` list is
   * allowed — it clears all tags from the file.
   */
  public SetMediaFileTags({
    mediaFileToken,
    tags,
  }: {
    mediaFileToken: string;
    tags: string[];
  }): Promise<ApiResponse<{ tags: TagDetails[]; removed_count: number }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/media_file/set/${mediaFileToken}`;
    return this.post<
      { maybe_tags_list: string[] },
      { success: boolean; tags: TagDetails[]; removed_count: number }
    >({ endpoint, body: { maybe_tags_list: tags } })
      .then((response) => ({
        success: response.success,
        data: { tags: response.tags ?? [], removed_count: response.removed_count },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /** Remove all tags from a media file. (Orphaned tags are not deleted.) */
  public ClearMediaFileTags({
    mediaFileToken,
  }: {
    mediaFileToken: string;
  }): Promise<ApiResponse<{ removed_count: number }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/media_file/clear/${mediaFileToken}`;
    return this.post<
      Record<string, never>,
      { success: boolean; removed_count: number }
    >({ endpoint, body: {} })
      .then((response) => ({
        success: response.success,
        data: { removed_count: response.removed_count },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // ── Media-file listings by tag state ─────────────────────────────────────

  /** The user's media files that carry at least one tag, newest first. */
  public ListTaggedMediaFiles(
    query: ListTagsQuery = {},
  ): Promise<ApiResponse<TagMediaFileListItem[], TagsCursor>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/media_files/list_tagged`;
    return this.listTagMediaFiles(endpoint, query);
  }

  /** The user's media files that carry no tags, newest first. */
  public ListUntaggedMediaFiles(
    query: ListTagsQuery = {},
  ): Promise<ApiResponse<TagMediaFileListItem[], TagsCursor>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/media_files/list_untagged`;
    return this.listTagMediaFiles(endpoint, query);
  }

  /** The user's media files carrying a specific tag, newest first. */
  public ListMediaFilesWithTag({
    tagToken,
    cursor,
    limit,
  }: {
    tagToken: string;
    cursor?: string;
    limit?: number;
  }): Promise<ApiResponse<TagMediaFileListItem[], TagsCursor>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/media_files/with_tag/${tagToken}`;
    return this.listTagMediaFiles(endpoint, { cursor, limit });
  }

  /**
   * Look up the tag sets of many media files at once. POST for the body,
   * but a pure read. Tokens with no tags come back with an empty list.
   */
  public BulkListMediaFileTags({
    mediaFileTokens,
  }: {
    mediaFileTokens: string[];
  }): Promise<ApiResponse<MediaFileTagsEntry[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tags/media_files/bulk_list_tags`;
    return this.post<
      { media_file_tokens: string[] },
      { success: boolean; media_files: MediaFileTagsEntry[] }
    >({ endpoint, body: { media_file_tokens: mediaFileTokens } })
      .then((response) => ({
        success: response.success,
        data: response.media_files ?? [],
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /** Shared GET for the cursor-paged tag-scoped media listings. */
  private listTagMediaFiles(
    endpoint: string,
    query: ListTagsQuery,
  ): Promise<ApiResponse<TagMediaFileListItem[], TagsCursor>> {
    const queryRecord: Record<string, string | number> = {};
    if (query.cursor) queryRecord.cursor = query.cursor;
    if (query.limit) queryRecord.limit = query.limit;
    return this.get<{
      success: boolean;
      media_files: TagMediaFileListItem[];
      maybe_cursor?: string | null;
    }>({ endpoint, query: queryRecord })
      .then((response) => ({
        success: response.success,
        data: response.media_files ?? [],
        pagination: { maybe_cursor: response.maybe_cursor },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }
}
