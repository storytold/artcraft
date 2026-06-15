use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::api_keys::common::ApiKeyPathInfo;
use artcraft_api_defs::api_keys::get_api_key::GetApiKeySuccessResponse;
use mysql_queries::queries::api_keys::get_api_key_by_token::{
  get_api_key_by_token, GetApiKeyByTokenArgs,
};
use tokens::tokens::api_keys::ApiKeyToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::api_keys::api_key_info_conversion::api_key_row_to_info;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

/// Fetch a single API key by its `token`, scoped to the logged-in user.
/// `NotFound` if the key doesn't exist or belongs to a different user (so we
/// don't leak the existence of others' keys). Never returns the full secret.
#[utoipa::path(
  get,
  tag = "API Keys",
  path = "/v1/api_keys/{api_key_token}",
  params(("api_key_token" = ApiKeyToken, description = "The API key's token (not the secret value)")),
  responses(
    (status = 200, body = GetApiKeySuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn get_api_key_handler(
  http_request: HttpRequest,
  path: Path<ApiKeyPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<GetApiKeySuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  let row = get_api_key_by_token(GetApiKeyByTokenArgs {
    token: &path.api_key_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("get_api_key_by_token failed: {:?}", err);
    CommonWebError::from_error(err)
  })?
  .filter(|row| row.owner_user_token == user_session.user_token)
  .ok_or(CommonWebError::NotFound)?;

  Ok(Json(GetApiKeySuccessResponse {
    success: true,
    api_key: api_key_row_to_info(row),
  }))
}
