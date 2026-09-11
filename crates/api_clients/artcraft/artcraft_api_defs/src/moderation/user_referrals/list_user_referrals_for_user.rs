use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use crate::moderation::user_referrals::list_global_user_referrals::UserReferralResponse;

// --- Request ---

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListUserReferralsForUserQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

#[derive(Deserialize, ToSchema)]
pub struct ListUserReferralsForUserPathInfo {
  pub username: String,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ListUserReferralsForUserSuccessResponse {
  pub success: bool,
  pub referrals: Vec<UserReferralResponse>,
  pub maybe_cursor: Option<String>,
}
