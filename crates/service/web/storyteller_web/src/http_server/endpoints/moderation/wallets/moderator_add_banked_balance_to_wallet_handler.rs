use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{info, warn};

use artcraft_api_defs::moderation::wallets::moderator_add_banked_balance_to_wallet::{
  ModeratorAddBankedBalanceToWalletPathInfo,
  ModeratorAddBankedBalanceToWalletRequest,
  ModeratorAddBankedBalanceToWalletResponse,
};
use enums::by_table::staff_audit_logs::staff_audit_action::StaffAuditAction;
use enums::by_table::staff_audit_logs::staff_audit_entity_type::StaffAuditEntityType;
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::staff_audit_logs::insert_staff_audit_log::{
  insert_staff_audit_log, InsertStaffAuditLogArgs,
};
use mysql_queries::queries::wallets::add_durable_banked_balance_to_wallet::add_durable_banked_balance_to_wallet;

use tokens::tokens::wallets::WalletToken;
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

  let user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|err| {
      warn!("Moderator check failed: {:?}", err);
      CommonWebError::NotAuthorized
    })?;

  let ip_address = get_request_ip(&http_request);

  info!(
    "Moderator {} adding {} banked credits to wallet {}",
    user_session.user_token.as_str(),
    request.credits,
    path.wallet_token.as_str(),
  );

  let mut transaction = server_state.mysql_pool.begin()
    .await
    .map_err(|err| {
      warn!("moderator_add_banked_balance_to_wallet transaction begin error: {:?}", err);
      CommonWebError::from_error(err)
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
      CommonWebError::from_anyhow_error(err)
    })?;

  // Insert staff audit log.
  let _audit_token = insert_staff_audit_log(InsertStaffAuditLogArgs {
    audit_action: StaffAuditAction::AddWalletBankedBalance,
    maybe_entity_type: Some(StaffAuditEntityType::Wallet),
    maybe_entity_token: Some(path.wallet_token.as_str()),
    staff_user_token: &user_session.user_token,
    actor_ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to insert staff audit log: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  transaction.commit()
    .await
    .map_err(|err| {
      warn!("moderator_add_banked_balance_to_wallet commit error: {:?}", err);
      CommonWebError::from_error(err)
    })?;

  Ok(Json(ModeratorAddBankedBalanceToWalletResponse {
    success: true,
  }))
}
