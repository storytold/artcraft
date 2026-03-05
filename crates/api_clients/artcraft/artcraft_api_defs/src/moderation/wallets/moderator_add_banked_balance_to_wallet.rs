use serde_derive::{Deserialize, Serialize};
use tokens::tokens::wallets::WalletToken;
use utoipa::ToSchema;

pub const MODERATOR_ADD_BANKED_BALANCE_TO_WALLET_PATH: &str = "/v1/moderation/wallet/{wallet_token}/add_banked_balance";

#[derive(Deserialize, ToSchema)]
pub struct ModeratorAddBankedBalanceToWalletPathInfo {
  pub wallet_token: WalletToken,
}

#[derive(Deserialize, ToSchema)]
pub struct ModeratorAddBankedBalanceToWalletRequest {
  pub credits: u16,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorAddBankedBalanceToWalletResponse {
  pub success: bool,
}
