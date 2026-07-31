/**
 * Media file response builders.
 *
 * The real backend emits a different subset of fields on nearly every endpoint
 * — `/file/:token` has no `origin`, `/list` renames `maybe_creator_user` to
 * `maybe_creator`, `/list/user/:username` has no creator at all — so each
 * variant gets its own builder rather than one object trimmed after the fact.
 * Getting this wrong is exactly the kind of bug the fake exists to surface.
 */

import { bucketPathToCdnUrl, bucketPathToThumbnailTemplate } from "../state/assets.ts";
import type { MediaFileRecord, UserRecord } from "../state/entities.ts";
import { store } from "../state/store.ts";

/** Extensions the real backend generates a thumbnail template for. */
const THUMBNAILED_TYPES = new Set(["jpg", "png", "gif", "image", "webp"]);

export interface MediaLinks {
  cdn_url: string;
  maybe_thumbnail_template: string | null;
  maybe_video_previews: {
    still: string;
    animated: string;
    still_thumbnail_template: string;
    animated_thumbnail_template: string;
  } | null;
}

export function mediaLinks(record: MediaFileRecord): MediaLinks {
  const cdnUrl = bucketPathToCdnUrl(record.bucketPath);
  const isVideo = record.mediaType === "mp4" || record.mediaClass === "video";

  return {
    cdn_url: cdnUrl,
    maybe_thumbnail_template: THUMBNAILED_TYPES.has(record.mediaType)
      ? bucketPathToThumbnailTemplate(record.bucketPath)
      : null,
    maybe_video_previews: isVideo
      ? {
          still: `${cdnUrl}-thumb.jpg`,
          animated: `${cdnUrl}-thumb.gif`,
          still_thumbnail_template: bucketPathToThumbnailTemplate(`${record.bucketPath}-thumb.jpg`),
          animated_thumbnail_template: bucketPathToThumbnailTemplate(`${record.bucketPath}-thumb.gif`),
        }
      : null,
  };
}

/** The four-field cover shape used by storyteller_web's own responses. */
export function coverImage(record: MediaFileRecord): object {
  const cover = coverLinks(record);
  const coverRecord = record.maybeCoverImageMediaFileToken === undefined
    ? undefined
    : store.mediaFilesByToken.get(record.maybeCoverImageMediaFileToken);

  return {
    maybe_cover_image_public_bucket_path: coverRecord === undefined ? null : `/media/${coverRecord.bucketPath}`,
    maybe_cover_image_public_bucket_url: coverRecord === undefined ? null : bucketPathToCdnUrl(coverRecord.bucketPath),
    maybe_links: cover,
    default_cover: defaultCover(record.token),
  };
}

/** The trimmed two-field cover shape used by mesh/splat/project lists. */
export function coverImageLight(record: MediaFileRecord): object {
  return {
    maybe_links: coverLinks(record),
    default_cover: defaultCover(record.token),
  };
}

export function userDetailsLight(user: UserRecord | undefined): object | null {
  if (user === undefined) {
    return null;
  }
  return {
    user_token: user.userToken,
    username: user.username,
    display_name: user.displayName,
    gravatar_hash: user.gravatarHash,
    default_avatar: user.defaultAvatar,
  };
}

export function originDetails(record: MediaFileRecord): object {
  return {
    origin_category: record.originCategory,
    product_category: record.originProductCategory,
    maybe_model: record.maybeOriginModelType === undefined ? null : { model_type: record.maybeOriginModelType },
  };
}

/** `GET /v1/media_files/file/:token`. Note: no `origin*` fields on this endpoint. */
export function getMediaFilePayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    maybe_engine_category: record.maybeEngineCategory ?? null,
    maybe_animation_type: record.maybeAnimationType ?? null,
    maybe_engine_extension: record.maybeEngineExtension ?? null,
    maybe_batch_token: record.maybeBatchToken ?? null,
    maybe_scene_source_media_file_token: record.maybeSceneSourceMediaFileToken ?? null,
    public_bucket_path: `/media/${record.bucketPath}`,
    public_bucket_url: bucketPathToCdnUrl(record.bucketPath),
    media_links: mediaLinks(record),
    cover_image: coverImage(record),
    maybe_model_weight_info: null,
    maybe_creator_user: creatorOf(record),
    creator_set_visibility: record.creatorSetVisibility,
    is_user_upload: record.isUserUpload,
    is_intermediate_system_file: record.isIntermediateSystemFile,
    maybe_title: record.maybeTitle ?? null,
    maybe_text_transcript: record.maybeTextTranscript ?? null,
    maybe_live_portrait_details: null,
    maybe_style_name: record.maybeStyleName ?? null,
    used_face_detailer: false,
    used_upscaler: false,
    maybe_prompt_token: record.maybePromptToken ?? null,
    maybe_original_filename: record.maybeOriginalFilename ?? null,
    maybe_duration_millis: record.maybeDurationMillis ?? null,
    is_emulated_media_file: false,
    is_featured: record.isFeatured,
    stats: entityStats(),
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    maybe_moderator_fields: null,
  };
}

/** `GET /v1/media_files/batch?tokens=…`. */
export function batchMediaFilePayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    maybe_engine_category: record.maybeEngineCategory ?? null,
    maybe_animation_type: record.maybeAnimationType ?? null,
    maybe_engine_extension: record.maybeEngineExtension ?? null,
    maybe_batch_token: record.maybeBatchToken ?? null,
    public_bucket_path: `/media/${record.bucketPath}`,
    public_bucket_url: bucketPathToCdnUrl(record.bucketPath),
    media_links: mediaLinks(record),
    cover_image: coverImage(record),
    maybe_model_weight_info: null,
    maybe_creator_user: creatorOf(record),
    creator_set_visibility: record.creatorSetVisibility,
    is_user_upload: record.isUserUpload,
    is_intermediate_system_file: record.isIntermediateSystemFile,
    maybe_title: record.maybeTitle ?? null,
    maybe_text_transcript: record.maybeTextTranscript ?? null,
    maybe_live_portrait_details: null,
    maybe_style_name: record.maybeStyleName ?? null,
    maybe_prompt_token: record.maybePromptToken ?? null,
    maybe_original_filename: record.maybeOriginalFilename ?? null,
    maybe_duration_millis: record.maybeDurationMillis ?? null,
    is_emulated_media_file: false,
    stats: entityStats(),
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/** `GET /v1/media_files/list` and `/list_featured` — creator key is `maybe_creator`. */
export function mediaFileListItemPayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    maybe_engine_category: record.maybeEngineCategory ?? null,
    maybe_animation_type: record.maybeAnimationType ?? null,
    origin_category: record.originCategory,
    origin_product_category: record.originProductCategory,
    maybe_origin_model_type: record.maybeOriginModelType ?? null,
    maybe_origin_model_token: null,
    origin: originDetails(record),
    public_bucket_path: `/media/${record.bucketPath}`,
    public_bucket_url: bucketPathToCdnUrl(record.bucketPath),
    media_links: mediaLinks(record),
    cover_image: coverImage(record),
    maybe_creator: creatorOf(record),
    stats: entityStats(),
    creator_set_visibility: record.creatorSetVisibility,
    is_user_upload: record.isUserUpload,
    is_intermediate_system_file: record.isIntermediateSystemFile,
    maybe_title: record.maybeTitle ?? null,
    maybe_text_transcript: record.maybeTextTranscript ?? null,
    maybe_style_name: record.maybeStyleName ?? null,
    maybe_duration_millis: record.maybeDurationMillis ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/** `GET /v1/media_files/list/user/:username` — no creator field at all. */
export function userMediaFileListItemPayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    maybe_engine_category: record.maybeEngineCategory ?? null,
    maybe_animation_type: record.maybeAnimationType ?? null,
    origin: originDetails(record),
    origin_category: record.originCategory,
    origin_product_category: record.originProductCategory,
    maybe_origin_model_type: record.maybeOriginModelType ?? null,
    maybe_origin_model_token: null,
    public_bucket_path: `/media/${record.bucketPath}`,
    public_bucket_url: bucketPathToCdnUrl(record.bucketPath),
    media_links: mediaLinks(record),
    maybe_prompt_token: record.maybePromptToken ?? null,
    cover_image: coverImage(record),
    creator_set_visibility: record.creatorSetVisibility,
    is_user_upload: record.isUserUpload,
    is_intermediate_system_file: record.isIntermediateSystemFile,
    maybe_title: record.maybeTitle ?? null,
    maybe_text_transcript: record.maybeTextTranscript ?? null,
    maybe_style_name: record.maybeStyleName ?? null,
    maybe_duration_millis: record.maybeDurationMillis ?? null,
    stats: entityStats(),
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/** `GET /v1/media_files/{mesh,splat}/list` — the narrow session shape. */
export function sessionMediaFilePayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    media_links: mediaLinks(record),
    cover_image: coverImageLight(record),
    maybe_creator_user: creatorOf(record),
    creator_set_visibility: record.creatorSetVisibility,
    maybe_prompt_token: record.maybePromptToken ?? null,
    maybe_title: record.maybeTitle ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/** `GET /v1/media_files/project/list`. */
export function projectMediaFilePayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    project_type: record.maybeProjectType ?? null,
    media_type: record.mediaType,
    media_links: mediaLinks(record),
    cover_image: coverImageLight(record),
    maybe_creator_user: creatorOf(record),
    creator_set_visibility: record.creatorSetVisibility,
    maybe_title: record.maybeTitle ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/** `GET /v1/media_files/search_{featured,session}` — no stats, no origin. */
export function searchMediaFilePayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    maybe_engine_category: record.maybeEngineCategory ?? null,
    maybe_animation_type: record.maybeAnimationType ?? null,
    public_bucket_path: `/media/${record.bucketPath}`,
    public_bucket_url: bucketPathToCdnUrl(record.bucketPath),
    media_links: mediaLinks(record),
    cover_image: coverImage(record),
    maybe_creator: creatorOf(record),
    creator_set_visibility: record.creatorSetVisibility,
    is_featured: record.isFeatured,
    is_user_upload: record.isUserUpload,
    is_intermediate_system_file: record.isIntermediateSystemFile,
    maybe_title: record.maybeTitle ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/** `GET /v1/media_files/batch/:batchToken`. */
export function batchListMediaFilePayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    maybe_engine_category: record.maybeEngineCategory ?? null,
    maybe_animation_type: record.maybeAnimationType ?? null,
    origin: originDetails(record),
    origin_category: record.originCategory,
    origin_product_category: record.originProductCategory,
    maybe_origin_model_type: record.maybeOriginModelType ?? null,
    maybe_origin_model_token: null,
    public_bucket_path: `/media/${record.bucketPath}`,
    public_bucket_url: bucketPathToCdnUrl(record.bucketPath),
    media_links: mediaLinks(record),
    cover_image: coverImage(record),
    creator_set_visibility: record.creatorSetVisibility,
    is_user_upload: record.isUserUpload,
    is_intermediate_system_file: record.isIntermediateSystemFile,
    maybe_title: record.maybeTitle ?? null,
    maybe_text_transcript: record.maybeTextTranscript ?? null,
    maybe_style_name: record.maybeStyleName ?? null,
    maybe_duration_millis: record.maybeDurationMillis ?? null,
    stats: entityStats(),
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/**
 * The row shape shared by folder and tag media listings. `addedToFolderAt` is
 * only present on folder responses.
 */
export function folderMediaFilePayload(record: MediaFileRecord, addedToFolderAt?: string): object {
  const payload: Record<string, unknown> = {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    maybe_prompt_token: record.maybePromptToken ?? null,
    maybe_batch_token: record.maybeBatchToken ?? null,
    media_links: mediaLinks(record),
    cover_image: coverImage(record),
    maybe_title: record.maybeTitle ?? null,
    maybe_original_filename: record.maybeOriginalFilename ?? null,
    maybe_frame_width: null,
    maybe_frame_height: null,
    maybe_duration_millis: record.maybeDurationMillis ?? null,
    creator_set_visibility: record.creatorSetVisibility,
    is_user_upload: record.isUserUpload,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };

  if (addedToFolderAt !== undefined) {
    payload["is_intermediate_system_file"] = record.isIntermediateSystemFile;
    payload["added_to_folder_at"] = addedToFolderAt;
  }

  return payload;
}

/** A thumbnail entry, used for folder covers. */
export function folderThumbnailPayload(record: MediaFileRecord): object {
  return {
    token: record.token,
    media_class: record.mediaClass,
    media_type: record.mediaType,
    cdn_url: bucketPathToCdnUrl(record.bucketPath),
    maybe_thumbnail_template: mediaLinks(record).maybe_thumbnail_template,
  };
}

function creatorOf(record: MediaFileRecord): object | null {
  if (record.maybeCreatorUserToken === undefined) {
    return null;
  }
  return userDetailsLight(store.usersByToken.get(record.maybeCreatorUserToken));
}

function coverLinks(record: MediaFileRecord): object | null {
  if (record.maybeCoverImageMediaFileToken === undefined) {
    return null;
  }
  const cover = store.mediaFilesByToken.get(record.maybeCoverImageMediaFileToken);
  if (cover === undefined) {
    return null;
  }
  return {
    cdn_url: bucketPathToCdnUrl(cover.bucketPath),
    thumbnail_template: bucketPathToThumbnailTemplate(cover.bucketPath),
  };
}

function entityStats(): object {
  return { positive_rating_count: 0, bookmark_count: 0 };
}

/** Deterministic placeholder cover derived from the token, as the real backend does. */
function defaultCover(token: string): { image_index: number; color_index: number } {
  return {
    image_index: hashToken(token, 25, 5),
    color_index: hashToken(token, 8, 1),
  };
}

function hashToken(token: string, modulo: number, salt: number): number {
  let hash = salt >>> 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (Math.imul(hash, 31) + token.charCodeAt(index)) >>> 0;
  }
  return hash % modulo;
}
