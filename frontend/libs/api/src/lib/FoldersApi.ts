import { ApiManager, ApiResponse } from "./ApiManager.js";
import { FolderInfo, FolderMediaFileListItem } from "./models/Folder.js";

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateFolderRequest {
  name: string;
  /** Omit (or null) to create a root-level folder. */
  maybe_parent_folder_token?: string | null;
  maybe_color_code?: string | null;
}

/** Cursor-based paging shared by `list_all`, subfolders, and folder media files. */
export interface ListFoldersQuery {
  cursor?: string;
  limit?: number;
}

/** Opaque cursor returned by the paged list endpoints; pass back as `cursor`. */
export interface FolderCursor {
  maybe_cursor?: string | null;
}

export interface MoveMediaFilesResult {
  accepted_media_file_tokens: string[];
  added_to_destination_count: number;
  removed_from_source_count: number;
}

// ─── API ───────────────────────────────────────────────────────────────────────

/**
 * Client for the `/v1/folders/*` endpoints. Folders nest arbitrarily (a folder
 * lives under at most one parent); media files may belong to zero or more
 * folders. All bulk endpoints are idempotent server-side. Paging is cursor
 * based — pass the previous response's `maybe_cursor` back as `cursor`.
 */
export class FoldersApi extends ApiManager {
  // ── Create / read / delete ────────────────────────────────────────────────

  /** Create a folder owned by the logged-in user, optionally under a parent. */
  public CreateFolder(
    params: CreateFolderRequest,
  ): Promise<ApiResponse<FolderInfo>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/create`;
    return this.post<
      CreateFolderRequest,
      { success: boolean; folder: FolderInfo; message?: string }
    >({ endpoint, body: params })
      .then((response) => ({
        success: response.success ?? false,
        data: response.folder,
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /** Fetch a single folder owned by the logged-in user. */
  public GetFolder({
    folderToken,
  }: {
    folderToken: string;
  }): Promise<ApiResponse<FolderInfo>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/folder/${folderToken}`;
    return this.get<{ success: boolean; folder: FolderInfo }>({ endpoint })
      .then((response) => ({ success: response.success, data: response.folder }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Soft-delete a folder. Its children keep their parent pointer and become
   * "orphaned" (surfaced via `list_all`'s `is_orphaned` flag); media files stay
   * in the library and in any other folders.
   */
  public DeleteFolder({
    folderToken,
  }: {
    folderToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/folder/${folderToken}`;
    return this.delete<null, { success: boolean; message?: string }>({
      endpoint,
    })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /** List every live folder owned by the logged-in user (newest first). */
  public ListAllFolders(
    query: ListFoldersQuery = {},
  ): Promise<ApiResponse<FolderInfo[], FolderCursor>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/list_all`;
    return this.get<{
      success: boolean;
      folders: FolderInfo[];
      maybe_cursor?: string | null;
    }>({ endpoint, query: toCursorQuery(query) })
      .then((response) => ({
        success: response.success,
        data: response.folders ?? [],
        pagination: { maybe_cursor: response.maybe_cursor },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // ── Folder mutations ──────────────────────────────────────────────────────

  /** Set or clear the folder color (hex, named color, or any string; null clears). */
  public SetColorCode({
    folderToken,
    colorCode,
  }: {
    folderToken: string;
    colorCode: string | null;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/folder/${folderToken}/color_code`;
    return this.put<
      { maybe_color_code: string | null },
      { success: boolean; message?: string }
    >({ endpoint, body: { maybe_color_code: colorCode } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Set or clear the folder's custom cover image (null clears). The server
   * resolves the supplied media file to a usable cover token (image/video used
   * directly, otherwise the file's own cover image); the resolved token is
   * returned as `data`.
   */
  public SetCoverImage({
    folderToken,
    mediaFileToken,
  }: {
    folderToken: string;
    mediaFileToken: string | null;
  }): Promise<ApiResponse<string | null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/folder/${folderToken}/cover_image`;
    return this.put<
      { maybe_media_file_token: string | null },
      {
        success: boolean;
        maybe_resolved_cover_media_file_token?: string | null;
        message?: string;
      }
    >({ endpoint, body: { maybe_media_file_token: mediaFileToken } })
      .then((response) => ({
        success: response.success ?? false,
        data: response.maybe_resolved_cover_media_file_token ?? null,
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /** Rename a folder. */
  public RenameFolder({
    folderToken,
    newName,
  }: {
    folderToken: string;
    newName: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/folder/${folderToken}/rename`;
    return this.put<
      { new_name: string },
      { success: boolean; message?: string }
    >({ endpoint, body: { new_name: newName } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /** Star or unstar a folder. */
  public SetStar({
    folderToken,
    hasStar,
  }: {
    folderToken: string;
    hasStar: boolean;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/folder/${folderToken}/star`;
    return this.put<
      { has_star: boolean },
      { success: boolean; message?: string }
    >({ endpoint, body: { has_star: hasStar } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // ── Subfolders ────────────────────────────────────────────────────────────

  /** List the direct subfolders of a parent folder (paginated). */
  public ListSubfolders({
    folderToken,
    query = {},
  }: {
    folderToken: string;
    query?: ListFoldersQuery;
  }): Promise<ApiResponse<FolderInfo[], FolderCursor>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/subfolders/${folderToken}`;
    return this.get<{
      success: boolean;
      subfolders: FolderInfo[];
      maybe_cursor?: string | null;
    }>({ endpoint, query: toCursorQuery(query) })
      .then((response) => ({
        success: response.success,
        data: response.subfolders ?? [],
        pagination: { maybe_cursor: response.maybe_cursor },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Reparent folders under `folderToken`. A folder lives in exactly one parent,
   * so this "moves" each into the target. Idempotent; returns the tokens that
   * stuck (`accepted_subfolder_tokens`).
   */
  public AddSubfolders({
    folderToken,
    subfolderTokens,
  }: {
    folderToken: string;
    subfolderTokens: string[];
  }): Promise<ApiResponse<string[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/subfolders/${folderToken}/bulk_add`;
    return this.post<
      { subfolder_tokens: string[] },
      {
        success: boolean;
        accepted_subfolder_tokens?: string[];
        message?: string;
      }
    >({ endpoint, body: { subfolder_tokens: subfolderTokens } })
      .then((response) => ({
        success: response.success ?? false,
        data: response.accepted_subfolder_tokens ?? [],
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /** Unparent folders from `folderToken` (they become root-level). Idempotent. */
  public RemoveSubfolders({
    folderToken,
    subfolderTokens,
  }: {
    folderToken: string;
    subfolderTokens: string[];
  }): Promise<ApiResponse<number>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/subfolders/${folderToken}/bulk_remove`;
    return this.post<
      { subfolder_tokens: string[] },
      { success: boolean; removed_count?: number; message?: string }
    >({ endpoint, body: { subfolder_tokens: subfolderTokens } })
      .then((response) => ({
        success: response.success ?? false,
        data: response.removed_count ?? 0,
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // ── Media files in a folder ───────────────────────────────────────────────

  /** List the media files inside a folder (paginated, newest first). */
  public ListFolderMediaFiles({
    folderToken,
    query = {},
  }: {
    folderToken: string;
    query?: ListFoldersQuery;
  }): Promise<ApiResponse<FolderMediaFileListItem[], FolderCursor>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/media_files/${folderToken}`;
    return this.get<{
      success: boolean;
      media_files: FolderMediaFileListItem[];
      maybe_cursor?: string | null;
    }>({ endpoint, query: toCursorQuery(query) })
      .then((response) => ({
        success: response.success,
        data: response.media_files ?? [],
        pagination: { maybe_cursor: response.maybe_cursor },
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Add media files to a folder. Idempotent (INSERT IGNORE); tokens that don't
   * exist or are soft-deleted are silently skipped — returns the accepted tokens.
   */
  public AddMediaFiles({
    folderToken,
    mediaFileTokens,
  }: {
    folderToken: string;
    mediaFileTokens: string[];
  }): Promise<ApiResponse<string[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/media_files/${folderToken}/bulk_add`;
    return this.post<
      { media_file_tokens: string[] },
      {
        success: boolean;
        accepted_media_file_tokens?: string[];
        message?: string;
      }
    >({ endpoint, body: { media_file_tokens: mediaFileTokens } })
      .then((response) => ({
        success: response.success ?? false,
        data: response.accepted_media_file_tokens ?? [],
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Atomically move media files from `sourceFolderToken` to `folderToken`
   * (destination) in a single transaction. Idempotent on both sides.
   */
  public MoveMediaFiles({
    folderToken,
    sourceFolderToken,
    mediaFileTokens,
  }: {
    folderToken: string;
    sourceFolderToken: string;
    mediaFileTokens: string[];
  }): Promise<ApiResponse<MoveMediaFilesResult>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/media_files/${folderToken}/bulk_move`;
    return this.post<
      { media_file_tokens: string[]; source_folder: string },
      {
        success: boolean;
        accepted_media_file_tokens?: string[];
        added_to_destination_count?: number;
        removed_from_source_count?: number;
        message?: string;
      }
    >({
      endpoint,
      body: {
        media_file_tokens: mediaFileTokens,
        source_folder: sourceFolderToken,
      },
    })
      .then((response) => ({
        success: response.success ?? false,
        data: {
          accepted_media_file_tokens: response.accepted_media_file_tokens ?? [],
          added_to_destination_count: response.added_to_destination_count ?? 0,
          removed_from_source_count: response.removed_from_source_count ?? 0,
        },
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  /**
   * Remove media files from a folder. Hard-deletes the membership rows only;
   * the files stay in the library and in any other folders. Idempotent.
   */
  public RemoveMediaFiles({
    folderToken,
    mediaFileTokens,
  }: {
    folderToken: string;
    mediaFileTokens: string[];
  }): Promise<ApiResponse<number>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/folders/media_files/${folderToken}/bulk_remove`;
    return this.post<
      { media_file_tokens: string[] },
      { success: boolean; removed_count?: number; message?: string }
    >({ endpoint, body: { media_file_tokens: mediaFileTokens } })
      .then((response) => ({
        success: response.success ?? false,
        data: response.removed_count ?? 0,
        errorMessage: response.message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }
}

/** Flatten the cursor query into the index-signed record `get()` expects. */
const toCursorQuery = (
  query: ListFoldersQuery,
): Record<string, string | number | undefined> => ({
  cursor: query.cursor,
  limit: query.limit,
});
