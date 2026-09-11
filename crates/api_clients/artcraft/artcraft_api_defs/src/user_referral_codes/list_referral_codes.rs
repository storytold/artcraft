use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct ListReferralCodesResponse {
  pub success: bool,
  pub referral_codes: Vec<ReferralCodeEntry>,
}

#[derive(Serialize, ToSchema)]
pub struct ReferralCodeEntry {
  pub token: UserReferralCodeToken,
  pub code: String,
  pub code_lowercase: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
