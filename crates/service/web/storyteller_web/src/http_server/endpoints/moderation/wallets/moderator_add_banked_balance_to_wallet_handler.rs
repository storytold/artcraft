use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::wallets::moderator_add_banked_balance_to_wallet::{
  ModeratorAddBankedBalanceToWalletPathInfo,
  ModeratorAddBankedBalanceToWalletRequest,
  ModeratorAddBankedBalanceToWalletResponse,
};
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use mysql_queries::queries::wallets::add_durable_banked_balance_to_wallet::add_durable_banked_balance_to_wallet;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// Add banked credits to a wallet (moderation)
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/wallet/{wallet_token}/add_banked_balance",
  request_body = ModeratorAddBankedBalanceToWalletRequest,
  responses(
    (status = 200, description = "Success", body = ModeratorAddBankedBalanceToWalletResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("wallet_token" = WalletToken, Path, description = "Wallet token to add credits to"),
  )
)]
pub async fn moderator_add_banked_balance_to_wallet_handler(
  http_request: HttpRequest,
  path: Path<ModeratorAddBankedBalanceToWalletPathInfo>,
  request: Json<ModeratorAddBankedBalanceToWalletRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorAddBankedBalanceToWalletResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let mut transaction = server_state.mysql_pool.begin()
    .await
    .map_err(|err| {
      warn!("moderator_add_banked_balance_to_wallet transaction begin error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let _result = add_durable_banked_balance_to_wallet(
    &path.wallet_token,
    request.credits as u64,
    None,
    Some(WalletLedgerEntryType::StaffAddBanked),
    &mut transaction,
  )
    .await
    .map_err(|err| {
      warn!("moderator_add_banked_balance_to_wallet error: {:?}", err);
      CommonWebError::ServerError
    })?;

  transaction.commit()
    .await
    .map_err(|err| {
      warn!("moderator_add_banked_balance_to_wallet commit error: {:?}", err);
      CommonWebError::ServerError
    })?;

  Ok(Json(ModeratorAddBankedBalanceToWalletResponse {
    success: true,
  }))
}
