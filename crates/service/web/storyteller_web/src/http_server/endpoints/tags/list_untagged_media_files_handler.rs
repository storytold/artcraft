use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;
use serde_derive::Serialize;
use utoipa::ToSchema;

use artcraft_api_defs::tags::list_untagged_media_files::ListUntaggedMediaFilesQueryParams;
use mysql_queries::queries::tags::list_untagged_media_files_for_user::{
  list_untagged_media_files_for_user, ListUntaggedMediaFilesForUserArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::endpoints::tags::tag_media_file_list_item::{
  tag_media_file_row_to_list_item, TagMediaFileListItem,
};
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "tags_untagged_mf";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

#[derive(Serialize, ToSchema)]
pub struct ListUntaggedMediaFilesSuccessResponse {
  pub success: bool,
  pub media_files: Vec<TagMediaFileListItem>,
  pub maybe_cursor: Option<String>,
}

/// Paginated list of the logged-in user's media files that carry no
/// tags at all. Newest first.
#[utoipa::path(
  get,
  tag = "Tags",
  path = "/v1/tags/media_files/list_untagged",
  params(ListUntaggedMediaFilesQueryParams),
  responses(
    (status = 200, body = ListUntaggedMediaFilesSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_untagged_media_files_handler(
  http_request: HttpRequest,
  query: Query<ListUntaggedMediaFilesQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListUntaggedMediaFilesSuccessResponse>, CommonWebError> {
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

  let rows = list_untagged_media_files_for_user(ListUntaggedMediaFilesForUserArgs {
    owner_user_token: &user_session.user_token,
    maybe_cursor_id,
    limit,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_untagged_media_files_for_user failed: {:?}", err);
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
    .map(|row| tag_media_file_row_to_list_item(row, media_domain, server_environment))
    .collect();

  Ok(Json(ListUntaggedMediaFilesSuccessResponse {
    success: true,
    media_files,
    maybe_cursor,
  }))
}
