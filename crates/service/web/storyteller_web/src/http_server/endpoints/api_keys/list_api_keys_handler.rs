use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::api_keys::list_api_keys::{ListApiKeysQueryParams, ListApiKeysSuccessResponse};
use mysql_queries::queries::api_keys::list_api_keys_for_user::{
  list_api_keys_for_user, ListApiKeysForUserArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::api_keys::api_key_info_conversion::api_key_row_to_info;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

/// List the logged-in user's API keys, newest first, **including
/// soft-deleted** keys. Paginated via `limit`/`offset`. Never returns the full
/// secret — each entry carries only the truncated key prefix.
#[utoipa::path(
  get,
  tag = "API Keys",
  path = "/v1/api_keys/list",
  params(ListApiKeysQueryParams),
  responses(
    (status = 200, body = ListApiKeysSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_api_keys_handler(
  http_request: HttpRequest,
  query: Query<ListApiKeysQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListApiKeysSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  let limit = query.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);
  let offset = query.offset.unwrap_or(0);

  let rows = list_api_keys_for_user(ListApiKeysForUserArgs {
    owner_user_token: &user_session.user_token,
    limit,
    offset,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_api_keys_for_user failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let api_keys = rows.into_iter().map(api_key_row_to_info).collect();

  Ok(Json(ListApiKeysSuccessResponse {
    success: true,
    api_keys,
  }))
}
