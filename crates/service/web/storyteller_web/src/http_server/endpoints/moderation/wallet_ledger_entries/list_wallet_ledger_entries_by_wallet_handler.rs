use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::wallet_ledger_entries::list_wallet_ledger_entries_by_wallet::{
  ListWalletLedgerEntriesByWalletEntry,
  ListWalletLedgerEntriesByWalletPathInfo,
  ListWalletLedgerEntriesByWalletResponse,
};
use mysql_queries::queries::wallet_ledger_entries::list_wallet_ledger_entries_by_wallet::list_wallet_ledger_entries_by_wallet;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// List wallet ledger entries by wallet token (moderation)
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/wallet_ledger_entries/wallet/{wallet_token}/list",
  responses(
    (status = 200, description = "Success", body = ListWalletLedgerEntriesByWalletResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("wallet_token" = WalletToken, Path, description = "Wallet token to look up ledger entries for"),
  )
)]
pub async fn list_wallet_ledger_entries_by_wallet_handler(
  http_request: HttpRequest,
  path: Path<ListWalletLedgerEntriesByWalletPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListWalletLedgerEntriesByWalletResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::Implicit)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let results = list_wallet_ledger_entries_by_wallet(&path.wallet_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("list_wallet_ledger_entries_by_wallet error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let entries = results.into_iter().map(|row| ListWalletLedgerEntriesByWalletEntry {
    token: row.token,
    wallet_token: row.wallet_token,
    entry_type: row.entry_type,
    maybe_entity_ref: row.maybe_entity_ref,
    credits_delta: row.credits_delta,
    banked_credits_before: row.banked_credits_before,
    banked_credits_after: row.banked_credits_after,
    monthly_credits_before: row.monthly_credits_before,
    monthly_credits_after: row.monthly_credits_after,
    created_at: row.created_at,
    is_refunded: row.is_refunded,
    maybe_linked_refund_ledger_token: row.maybe_linked_refund_ledger_token,
  }).collect();

  Ok(Json(ListWalletLedgerEntriesByWalletResponse {
    success: true,
    entries,
  }))
}
