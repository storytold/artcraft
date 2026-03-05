use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::wallets::list_user_wallets::{
  ListUserWalletsEntry,
  ListUserWalletsPathInfo,
  ListUserWalletsResponse,
};
use mysql_queries::queries::wallets::list_user_wallets_for_moderation::list_user_wallets_for_moderation;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// List wallets for a user (moderation)
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/wallets/user/{user_token}/list",
  responses(
    (status = 200, description = "Success", body = ListUserWalletsResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("user_token" = UserToken, Path, description = "User token to look up wallets for"),
  )
)]
pub async fn list_user_wallets_handler(
  http_request: HttpRequest,
  path: Path<ListUserWalletsPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListUserWalletsResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::Implicit)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let results = list_user_wallets_for_moderation(&path.user_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("list_user_wallets error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let wallets = results.into_iter().map(|row| ListUserWalletsEntry {
    token: row.token,
    wallet_namespace: row.wallet_namespace,
    banked_credits: row.banked_credits,
    monthly_credits: row.monthly_credits,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }).collect();

  Ok(Json(ListUserWalletsResponse {
    success: true,
    wallets,
  }))
}
