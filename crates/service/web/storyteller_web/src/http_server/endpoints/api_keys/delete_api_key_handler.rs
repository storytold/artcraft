use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::api_keys::common::ApiKeyPathInfo;
use artcraft_api_defs::api_keys::delete_api_key::DeleteApiKeySuccessResponse;
use mysql_queries::queries::api_keys::delete_api_key::{delete_api_key, DeleteApiKeyArgs};
use mysql_queries::queries::api_keys::get_api_key_by_token::{
  get_api_key_by_token, GetApiKeyByTokenArgs,
};
use tokens::tokens::api_keys::ApiKeyToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

/// Soft-delete an API key by `token`, scoped to the logged-in user.
#[utoipa::path(
  delete,
  tag = "API Keys",
  path = "/v1/api_keys/{api_key_token}",
  params(("api_key_token" = ApiKeyToken, description = "The API key's token (not the secret value)")),
  responses(
    (status = 200, body = DeleteApiKeySuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn delete_api_key_handler(
  http_request: HttpRequest,
  path: Path<ApiKeyPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<DeleteApiKeySuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  // The by-token delete query isn't owner-scoped, so first look the key up and
  // confirm ownership. Return NotFound for missing OR other-owned keys, so we
  // never leak the existence of another user's key.
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

  // Only issue the delete if the key is still live. If it's already
  // soft-deleted the desired end state already holds, so treat it as success.
  if row.maybe_deleted_at.is_none() {
    delete_api_key(DeleteApiKeyArgs {
      token: &path.api_key_token,
      mysql_executor: &mut *conn,
      phantom: PhantomData,
    }).await.map_err(|err| {
      warn!("delete_api_key failed: {:?}", err);
      CommonWebError::from_error(err)
    })?;
  }

  Ok(Json(DeleteApiKeySuccessResponse { success: true }))
}
