import { ApiManager, ApiResponse } from "./ApiManager.js";
import { MediaLinks, MediaFileCoverImageDetails } from "./models/Folder.js";
import { PaginationInfinite } from "./models/Pagination.js";
import { Visibility } from "./enums/Visibility.js";

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * The kind of internal Artcraft project document. Exact wire strings — the
 * backend uses explicit serde renames for `scene_3d` / `editor_2d` (no
 * `scene3d` / `editor2d` forms). `workflow` exists server-side but has no
 * save endpoint yet.
 */
export type ProjectType =
  | "scene_3d"
  | "mood_board"
  | "editor_2d"
  | "video_timeline";

/** One project row from `GET /v1/media_files/project/list`. */
export interface ProjectMediaFileInfo {
  token: string;
  /** Always "project" for these endpoints. */
  media_class: string;
  /** The specific project document kind. */
  project_type: ProjectType;
  /** File format (scene_json, mood_json, timeline_json, editor_json, json). */
  media_type: string;
  media_links: MediaLinks;
  cover_image: MediaFileCoverImageDetails;
  maybe_creator_user?: {
    user_token: string;
    username: string;
    display_name: string;
  } | null;
  creator_set_visibility: string;
  maybe_title?: string | null;
  created_at: string;
  updated_at: string;
}

/** Pagination-only query for the session project list. */
export interface ListSessionProjectsQuery {
  /** Optional filter on the specific project document type. */
  filter_project_type?: ProjectType;
  sort_ascending?: boolean;
  page_size?: number;
  cursor?: string;
  cursor_is_reversed?: boolean;
}

// ─── API ───────────────────────────────────────────────────────────────────

/**
 * Client for the project-document persistence endpoints
 * (`/v1/media_files/upload/project/{kind}/{new,update}` and
 * `/v1/media_files/project/list`).
 *
 * Projects are internal Artcraft JSON documents (3D scenes, mood boards, 2D
 * editor documents, video timelines) stored as media files with
 * `media_class = "project"`. Save-new returns a media file token; further
 * saves of the same project go through {@link UpdateProject} with that token.
 * The update endpoint also accepts LEGACY 3D-scene rows (saved through the
 * old `upload/new_scene` flow before the project split) and upgrades them in
 * place — the token is preserved.
 */
export class ProjectsApi extends ApiManager {
  /**
   * Save a brand-new project document. Returns the new media file token.
   * Anonymous (logged-out) users may also save.
   */
  public async UploadNewProject({
    projectType,
    blob,
    fileName,
    uuid,
    maybe_title,
    maybe_visibility,
  }: {
    projectType: ProjectType;
    /** The project JSON document. */
    blob: Blob | File;
    fileName: string;
    /** UUID for request idempotency — generate a fresh one per attempt. */
    uuid: string;
    maybe_title?: string;
    maybe_visibility?: Visibility;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/project/${projectType}/new`;
    return this.uploadProjectForm({
      endpoint,
      blob,
      fileName,
      uuid,
      options: {
        maybe_title,
        maybe_visibility: maybe_visibility?.toString(),
      },
    });
  }

  /**
   * Overwrite an existing project document (same token). Only call this for
   * saves of a project the user already owns; use {@link UploadNewProject}
   * to save a fresh copy.
   */
  public async UpdateProject({
    projectType,
    token,
    blob,
    fileName,
    uuid,
    maybe_title,
  }: {
    projectType: ProjectType;
    /** The project's media file token. */
    token: string;
    /** The project JSON document. */
    blob: Blob | File;
    fileName: string;
    /** UUID for request idempotency — generate a fresh one per attempt. */
    uuid: string;
    maybe_title?: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/upload/project/${projectType}/update/${token}`;
    return this.uploadProjectForm({
      endpoint,
      blob,
      fileName,
      uuid,
      options: { maybe_title },
    });
  }

  /**
   * List the session user's project documents, newest first. Cursor-based —
   * pass the previous response's `pagination.maybe_next` back as `cursor`.
   */
  public async ListSessionProjects(
    query: ListSessionProjectsQuery = {},
  ): Promise<ApiResponse<ProjectMediaFileInfo[], PaginationInfinite>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/project/list`;
    return await this.get<{
      success: boolean;
      results: ProjectMediaFileInfo[];
      pagination?: PaginationInfinite;
    }>({ endpoint, query: { ...query } })
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

  /** Shared multipart POST for the save-new / update endpoints. */
  private async uploadProjectForm({
    endpoint,
    blob,
    fileName,
    uuid,
    options,
  }: {
    endpoint: string;
    blob: Blob | File;
    fileName: string;
    uuid: string;
    options: Record<string, string | undefined>;
  }): Promise<ApiResponse<string>> {
    const formRecord = Object.entries(options).reduce(
      (allOptions, [key, value]) => {
        if (value === undefined) {
          return allOptions;
        }
        return { ...allOptions, [key]: value };
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
