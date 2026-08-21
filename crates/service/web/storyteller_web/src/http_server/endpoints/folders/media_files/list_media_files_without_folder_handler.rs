use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use serde_derive::Serialize;
use utoipa::ToSchema;

use artcraft_api_defs::common::responses::media_links::MediaLinks;
use artcraft_api_defs::folders::media_files::ListMediaFilesWithoutFolderQueryParams;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::folders::media_files::list_media_files_without_folder::{
  list_media_files_without_folder, ListMediaFilesWithoutFolderArgs,
};
use mysql_queries::queries::media_files::list::media_file_list_row::MediaFileListRow;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_file_list_conversion::build_media_links_and_cover;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "folders_unfoldered_mf";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

// ── Response shape ──

#[derive(Serialize, ToSchema)]
pub struct ListMediaFilesWithoutFolderSuccessResponse {
  pub success: bool,
  pub media_files: Vec<UnfolderedMediaFileListItem>,

  /// Cursor for the next page. Only present when this page was full —
  /// a short page means the list is exhausted.
  pub maybe_cursor: Option<String>,
}

/// One media file as it appears in the unfoldered list. Same lean shape as
/// the folder / tag list items. Intermediate system files are filtered out
/// by the query, so the flag isn't part of the wire shape.
#[derive(Serialize, ToSchema)]
pub struct UnfolderedMediaFileListItem {
  pub token: MediaFileToken,

  /// Coarse-grained class (image / video / audio / mesh / splat / ...).
  pub media_class: MediaFileClass,

  /// Specific format (jpg, png, mp4, glb, etc.) — closer to a MIME type.
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

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// ── Handler ──

/// Paginated list of the logged-in user's media files that sit in no folder
/// at all (memberships pointing at soft-deleted folders count as
/// unfoldered). Newest first.
///
/// Use `filter_media_class` to scope the results to a single media class.
#[utoipa::path(
  get,
  tag = "Folders (Media File Management)",
  path = "/v1/folders/media_files_without_folder",
  params(ListMediaFilesWithoutFolderQueryParams),
  responses(
    (status = 200, body = ListMediaFilesWithoutFolderSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_media_files_without_folder_handler(
  http_request: HttpRequest,
  query: Query<ListMediaFilesWithoutFolderQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListMediaFilesWithoutFolderSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  let limit = query.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);

  let maybe_cursor_id = match &query.cursor {
    None => None,
    Some(cursor_str) => {
      Some(server_state.opaque_cursors.decode_last_id_cursor(CURSOR_NAME, cursor_str)?)
    }
  };

  let rows = list_media_files_without_folder(ListMediaFilesWithoutFolderArgs {
    owner_user_token: &user_session.user_token,
    maybe_filter_media_class: query.filter_media_class,
    maybe_cursor_id,
    limit,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_media_files_without_folder failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // Only hand out a next-page cursor when this page was full. A short page
  // means the list is exhausted, and emitting a cursor anyway would make
  // clients fetch one guaranteed-empty trailing page.
  let maybe_cursor = if rows.len() == limit as usize {
    rows.last()
        .map(|last| server_state.opaque_cursors.encode_last_id_cursor(CURSOR_NAME, last.media_file_id))
        .transpose()?
  } else {
    None
  };

  let media_domain = get_media_domain(&http_request);
  let server_environment = server_state.server_environment;

  let media_files = rows.into_iter()
    .map(|row| unfoldered_media_file_row_to_list_item(row, media_domain, server_environment))
    .collect();

  Ok(Json(ListMediaFilesWithoutFolderSuccessResponse {
    success: true,
    media_files,
    maybe_cursor,
  }))
}

fn unfoldered_media_file_row_to_list_item(
  row: MediaFileListRow,
  media_domain: MediaDomain,
  server_environment: server_environment::ServerEnvironment,
) -> UnfolderedMediaFileListItem {
  let (media_links, cover_image) =
      build_media_links_and_cover(&row, media_domain, server_environment);

  UnfolderedMediaFileListItem {
    token: row.media_file_token,
    media_class: row.media_class,
    media_type: row.media_type,
    maybe_batch_token: row.maybe_batch_token,
    media_links,
    cover_image,
    creator_set_visibility: row.creator_set_visibility,
    is_user_upload: row.is_user_upload,
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
