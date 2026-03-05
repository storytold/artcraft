use chrono::{DateTime, Utc};
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;
use utoipa::ToSchema;

pub const MODERATOR_GET_WALLET_LEDGER_ENTRY_PATH: &str = "/v1/moderation/wallet_ledger_entry/{wallet_ledger_entry_token}";

#[derive(Deserialize, ToSchema)]
pub struct ModeratorGetWalletLedgerEntryPathInfo {
  pub wallet_ledger_entry_token: WalletLedgerEntryToken,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorGetWalletLedgerEntryResponse {
  pub success: bool,
  pub maybe_entry: Option<ModeratorGetWalletLedgerEntryDetails>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorGetWalletLedgerEntryDetails {
  pub token: WalletLedgerEntryToken,
  pub entry_type: WalletLedgerEntryType,
  pub maybe_entity_ref: Option<String>,
  pub credits_delta: i32,
  pub banked_credits_before: u32,
  pub banked_credits_after: u32,
  pub monthly_credits_before: u32,
  pub monthly_credits_after: u32,
  pub is_refunded: bool,
  pub maybe_linked_refund_ledger_token: Option<WalletLedgerEntryToken>,
  pub created_at: DateTime<Utc>,
}
