use enums::common::payments_namespace::PaymentsNamespace;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;
use utoipa::ToSchema;

pub const MODERATOR_CREATE_WALLET_FOR_USER_PATH: &str = "/v1/moderation/wallet/create_for_user";

#[derive(Deserialize, ToSchema)]
pub struct ModeratorCreateWalletForUserRequest {
  pub user_token: Option<UserToken>,
  pub payments_namespace: Option<PaymentsNamespace>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorCreateWalletForUserResponse {
  pub success: bool,
  pub wallet_token: WalletToken,
}
