use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::wallets::moderator_get_wallet::{
  ModeratorGetWalletDetails,
  ModeratorGetWalletPathInfo,
  ModeratorGetWalletResponse,
};
use mysql_queries::queries::wallets::get_wallet_for_moderation::get_wallet_for_moderation;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// Get a single wallet by token (moderation)
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/wallet/{wallet_token}",
  responses(
    (status = 200, description = "Success", body = ModeratorGetWalletResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("wallet_token" = WalletToken, Path, description = "Wallet token to look up"),
  )
)]
pub async fn moderator_get_wallet_handler(
  http_request: HttpRequest,
  path: Path<ModeratorGetWalletPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorGetWalletResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let maybe_wallet = get_wallet_for_moderation(&path.wallet_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("moderator_get_wallet error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let maybe_wallet_details = maybe_wallet.map(|wallet| ModeratorGetWalletDetails {
    token: wallet.token,
    wallet_namespace: wallet.wallet_namespace,
    owner_user_token: wallet.owner_user_token,
    banked_credits: wallet.banked_credits,
    monthly_credits: wallet.monthly_credits,
    version: wallet.version,
    created_at: wallet.created_at,
    updated_at: wallet.updated_at,
  });

  Ok(Json(ModeratorGetWalletResponse {
    success: true,
    maybe_wallet: maybe_wallet_details,
  }))
}
