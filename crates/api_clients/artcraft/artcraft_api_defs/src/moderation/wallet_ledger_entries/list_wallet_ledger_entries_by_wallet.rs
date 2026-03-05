use chrono::{DateTime, Utc};
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;
use tokens::tokens::wallets::WalletToken;
use utoipa::ToSchema;

pub const LIST_WALLET_LEDGER_ENTRIES_BY_WALLET_PATH: &str = "/v1/moderation/wallet_ledger_entries/wallet/{wallet_token}/list";

#[derive(Deserialize, ToSchema)]
pub struct ListWalletLedgerEntriesByWalletPathInfo {
  pub wallet_token: WalletToken,
}

#[derive(Serialize, ToSchema)]
pub struct ListWalletLedgerEntriesByWalletResponse {
  pub success: bool,
  pub entries: Vec<ListWalletLedgerEntriesByWalletEntry>,
}

#[derive(Serialize, ToSchema)]
pub struct ListWalletLedgerEntriesByWalletEntry {
  pub token: WalletLedgerEntryToken,
  pub wallet_token: WalletToken,
  pub entry_type: WalletLedgerEntryType,
  pub maybe_entity_ref: Option<String>,
  pub credits_delta: i32,
  pub banked_credits_before: u32,
  pub banked_credits_after: u32,
  pub monthly_credits_before: u32,
  pub monthly_credits_after: u32,
  pub created_at: DateTime<Utc>,
  pub is_refunded: bool,
  pub maybe_linked_refund_ledger_token: Option<WalletLedgerEntryToken>,
}
