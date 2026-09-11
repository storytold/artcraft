use serde_derive::{Deserialize, Serialize};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct DeleteReferralCodePathInfo {
  pub token: UserReferralCodeToken,
}

#[derive(Serialize, ToSchema)]
pub struct DeleteReferralCodeResponse {
  pub success: bool,
}
