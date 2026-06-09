use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path, Query};
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use serde_derive::Serialize;
use utoipa::ToSchema;

use artcraft_api_defs::common::responses::media_links::MediaLinks;
use artcraft_api_defs::folders::media_files::{
  FolderMediaFilesPathInfo, ListFolderMediaFilesQueryParams,
};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::media_files::list_folder_media_files::{
  list_folder_media_files, FolderMediaFileRow, ListFolderMediaFilesArgs,
};
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "folder_mf";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

// ── Response shape ──

#[derive(Serialize, ToSchema)]
pub struct ListFolderMediaFilesSuccessResponse {
  pub success: bool,
  pub media_files: Vec<FolderMediaFileListItem>,
  pub maybe_cursor: Option<String>,
}

/// One media file as it appears inside a folder. Lean version of the
/// "by batch" / "by user" list-item shape — keeps the fields that matter
/// for folder browsing and drops the bucket-path noise.
#[derive(Serialize, ToSchema)]
pub struct FolderMediaFileListItem {
  pub token: MediaFileToken,

  /// Coarse-grained class (image / video / audio / dimensional).
  pub media_class: MediaFileClass,

  /// Specific format (jpg, png, mp4, etc.) — closer to a MIME type.
  pub media_type: MediaFileType,

  /// Link to the prompt
  pub maybe_prompt_token: Option<PromptToken>,

  /// If this file was generated as part of a batch, the batch token —
  /// useful for showing "siblings" in the UI.
  pub maybe_batch_token: Option<BatchGenerationToken>,

  /// Rich CDN links to the media itself (full URL, thumbnail template,
  /// video previews when applicable).
  pub media_links: MediaLinks,

  /// Cover image details. For files that don't carry their own cover
  /// image, this still gives the deterministic default-cover spec
  /// (image_index + color_index) the frontend uses for placeholders.
  pub cover_image: MediaFileCoverImageDetails,

  pub maybe_title: Option<String>,
  pub maybe_original_filename: Option<String>,

  /// Original pixel width / height for image and video files when known.
  pub maybe_frame_width: Option<i32>,
  pub maybe_frame_height: Option<i32>,

  /// Duration for audio and video files, if available. Milliseconds.
  pub maybe_duration_millis: Option<u64>,

  pub creator_set_visibility: Visibility,
  pub is_user_upload: bool,
  pub is_intermediate_system_file: bool,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// When the media file was added to the folder.
  pub added_to_folder_at: DateTime<Utc>,
}

// ── Handler ──

#[utoipa::path(
  get,
  tag = "Folders (Media File Management)",
  path = "/v1/folders/media_files/{folder_token}",
  params(
    ("folder_token" = FolderToken, description = "Folder token"),
    ListFolderMediaFilesQueryParams,
  ),
  responses(
    (status = 200, body = ListFolderMediaFilesSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_folder_media_files_handler(
  http_request: HttpRequest,
  path: Path<FolderMediaFilesPathInfo>,
  query: Query<ListFolderMediaFilesQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListFolderMediaFilesSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  let folder = get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Folder lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  if folder.is_none() {
    return Err(CommonWebError::NotFound);
  }

  let limit = query.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);

  let maybe_cursor_id = match &query.cursor {
    None => None,
    Some(cursor_str) => {
      let decoded = server_state.opaque_cursors
        .decode_cursor_expecting_name(CURSOR_NAME, cursor_str)
        .map_err(|err| {
          warn!("Failed to decode cursor: {:?}", err);
          CommonWebError::BadInputWithSimpleMessage("Invalid cursor".to_string())
        })?;
      decoded.last_id
    }
  };

  let rows = list_folder_media_files(ListFolderMediaFilesArgs {
    folder_token: &path.folder_token,
    maybe_cursor_id,
    limit,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_folder_media_files failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_cursor = rows.last().map(|last| {
    server_state.opaque_cursors.encode_last_id_cursor(CURSOR_NAME, last.membership_id)
  }).transpose().map_err(|err| {
    warn!("Failed to encode cursor: {:?}", err);
    CommonWebError::server_error_with_message("Failed to encode cursor")
  })?;

  let media_domain = get_media_domain(&http_request);
  let server_environment = server_state.server_environment;

  let media_files = rows.into_iter()
    .map(|row| folder_media_file_row_to_list_item(row, media_domain, server_environment))
    .collect();

  Ok(Json(ListFolderMediaFilesSuccessResponse {
    success: true,
    media_files,
    maybe_cursor,
  }))
}

fn folder_media_file_row_to_list_item(
  row: FolderMediaFileRow,
  media_domain: MediaDomain,
  server_environment: server_environment::ServerEnvironment,
) -> FolderMediaFileListItem {
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &row.public_bucket_directory_hash,
    row.maybe_public_bucket_prefix.as_deref(),
    row.maybe_public_bucket_extension.as_deref(),
  );

  let media_links = MediaLinksBuilder::from_media_path_and_env(
    media_domain,
    server_environment,
    &bucket_path,
  );

  let cover_image = MediaFileCoverImageDetails::from_optional_db_fields(
    &row.media_file_token,
    media_domain,
    server_environment,
    row.maybe_cover_public_bucket_directory_hash.as_deref(),
    row.maybe_cover_public_bucket_prefix.as_deref(),
    row.maybe_cover_public_bucket_extension.as_deref(),
  );

  FolderMediaFileListItem {
    token: row.media_file_token,
    added_to_folder_at: row.added_to_folder_at,
    media_class: row.media_class,
    media_type: row.media_type,
    maybe_batch_token: row.maybe_batch_token,
    media_links,
    cover_image,
    creator_set_visibility: row.creator_set_visibility,
    is_user_upload: row.is_user_upload,
    is_intermediate_system_file: row.is_intermediate_system_file,
    maybe_title: row.maybe_title,
    maybe_prompt_token: row.maybe_prompt_token,
    maybe_original_filename: row.maybe_origin_filename,
    // Schema stores `INT(10)`; widen to u64 for the wire shape.
    maybe_duration_millis: row.maybe_duration_millis.map(|n| n as u64),
    maybe_frame_width: row.maybe_frame_width,
    maybe_frame_height: row.maybe_frame_height,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
