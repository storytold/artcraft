use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::tags::list_tags::{ListTagsQueryParams, ListTagsSuccessResponse};
use mysql_queries::queries::tags::list_tags_for_user::{list_tags_for_user, ListTagsForUserArgs};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::tags::tag_details::tag_row_to_details;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "tags_list";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

/// Paginated list of the logged-in user's tags, newest first.
#[utoipa::path(
  get,
  tag = "Tags",
  path = "/v1/tags/list",
  params(ListTagsQueryParams),
  responses(
    (status = 200, body = ListTagsSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_tags_handler(
  http_request: HttpRequest,
  query: Query<ListTagsQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListTagsSuccessResponse>, CommonWebError> {
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

  let rows = list_tags_for_user(ListTagsForUserArgs {
    creator_user_token: &user_session.user_token,
    maybe_cursor_id,
    limit,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_tags_for_user failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_cursor = rows.last().map(|last| {
    server_state.opaque_cursors.encode_last_id_cursor(CURSOR_NAME, last.id)
  }).transpose()?;

  Ok(Json(ListTagsSuccessResponse {
    success: true,
    tags: rows.into_iter().map(tag_row_to_details).collect(),
    maybe_cursor,
  }))
}
