use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::api_keys::common::ApiKeyPathInfo;
use artcraft_api_defs::api_keys::update_api_key::{UpdateApiKeyRequest, UpdateApiKeySuccessResponse};
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::api_keys::get_api_key_by_token::{
  get_api_key_by_token, GetApiKeyByTokenArgs,
};
use mysql_queries::queries::api_keys::update_api_key::{update_api_key, UpdateApiKeyArgs};
use tokens::tokens::api_keys::ApiKeyToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

const MAX_DESCRIPTION_LEN: usize = 512;

/// Update an API key's description (also refreshing its update IP), scoped to
/// the logged-in user. `NotFound` if the key doesn't exist, belongs to another
/// user, or has been deleted.
#[utoipa::path(
  put,
  tag = "API Keys",
  path = "/v1/api_keys/{api_key_token}",
  params(("api_key_token" = ApiKeyToken, description = "The API key's token (not the secret value)")),
  request_body = UpdateApiKeyRequest,
  responses(
    (status = 200, body = UpdateApiKeySuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn update_api_key_handler(
  http_request: HttpRequest,
  path: Path<ApiKeyPathInfo>,
  request: Json<UpdateApiKeyRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<UpdateApiKeySuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  if let Some(description) = &request.maybe_description {
    if description.len() > MAX_DESCRIPTION_LEN {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        format!("description too long (max {} chars)", MAX_DESCRIPTION_LEN),
      ));
    }
  }

  // Confirm the key exists and is owned by this user before updating (the
  // update query isn't owner-scoped). NotFound for missing/other-owned keys.
  let existing = get_api_key_by_token(GetApiKeyByTokenArgs {
    token: &path.api_key_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("get_api_key_by_token failed: {:?}", err);
    CommonWebError::from_error(err)
  })?
  .filter(|row| row.owner_user_token == user_session.user_token)
  .ok_or(CommonWebError::NotFound)?;

  if existing.maybe_deleted_at.is_some() {
    return Err(CommonWebError::NotFound);
  }

  let ip_address = get_request_ip(&http_request);

  update_api_key(UpdateApiKeyArgs {
    token: &path.api_key_token,
    maybe_description: request.maybe_description.as_deref(),
    ip_address: &ip_address,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("update_api_key failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(UpdateApiKeySuccessResponse { success: true }))
}
