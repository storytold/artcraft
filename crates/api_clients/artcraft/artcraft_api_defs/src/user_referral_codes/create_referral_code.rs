use serde_derive::{Deserialize, Serialize};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct CreateReferralCodeRequest {
  /// The referral code string. Alphanumeric plus underscore, period, dash.
  pub code: String,
}

#[derive(Serialize, ToSchema)]
pub struct CreateReferralCodeResponse {
  pub success: bool,
  pub token: UserReferralCodeToken,
  pub code: String,
  pub code_lowercase: String,
}
