use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::wallet_ledger_entries::moderator_get_wallet_ledger_entry::{
  ModeratorGetWalletLedgerEntryDetails,
  ModeratorGetWalletLedgerEntryPathInfo,
  ModeratorGetWalletLedgerEntryResponse,
};
use mysql_queries::queries::wallet_ledger_entries::get_wallet_ledger_entry_for_moderation::get_wallet_ledger_entry_for_moderation;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// Get a single wallet ledger entry by token (moderation)
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/wallet_ledger_entry/{wallet_ledger_entry_token}",
  responses(
    (status = 200, description = "Success", body = ModeratorGetWalletLedgerEntryResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("wallet_ledger_entry_token" = WalletLedgerEntryToken, Path, description = "Wallet ledger entry token to look up"),
  )
)]
pub async fn moderator_get_wallet_ledger_entry_handler(
  http_request: HttpRequest,
  path: Path<ModeratorGetWalletLedgerEntryPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorGetWalletLedgerEntryResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let maybe_entry = get_wallet_ledger_entry_for_moderation(&path.wallet_ledger_entry_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("moderator_get_wallet_ledger_entry error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let maybe_entry_details = maybe_entry.map(|entry| ModeratorGetWalletLedgerEntryDetails {
    token: entry.token,
    entry_type: entry.entry_type,
    maybe_entity_ref: entry.maybe_entity_ref,
    credits_delta: entry.credits_delta,
    banked_credits_before: entry.banked_credits_before,
    banked_credits_after: entry.banked_credits_after,
    monthly_credits_before: entry.monthly_credits_before,
    monthly_credits_after: entry.monthly_credits_after,
    is_refunded: entry.is_refunded,
    maybe_linked_refund_ledger_token: entry.maybe_linked_refund_ledger_token,
    created_at: entry.created_at,
  });

  Ok(Json(ModeratorGetWalletLedgerEntryResponse {
    success: true,
    maybe_entry: maybe_entry_details,
  }))
}
