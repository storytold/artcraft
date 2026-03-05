use chrono::{DateTime, Utc};
use enums::common::payments_namespace::PaymentsNamespace;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;
use utoipa::ToSchema;

pub const MODERATOR_GET_WALLET_PATH: &str = "/v1/moderation/wallet/{wallet_token}";

#[derive(Deserialize, ToSchema)]
pub struct ModeratorGetWalletPathInfo {
  pub wallet_token: WalletToken,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorGetWalletResponse {
  pub success: bool,
  pub maybe_wallet: Option<ModeratorGetWalletDetails>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorGetWalletDetails {
  pub token: WalletToken,
  pub wallet_namespace: PaymentsNamespace,
  pub owner_user_token: UserToken,
  pub banked_credits: u32,
  pub monthly_credits: u32,
  pub version: i32,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
