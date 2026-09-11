use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;
use utoipa::{IntoParams, ToSchema};

// --- Request ---

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListGlobalUserReferralsQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ListGlobalUserReferralsSuccessResponse {
  pub success: bool,
  pub referrals: Vec<UserReferralResponse>,
  pub maybe_cursor: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct UserReferralResponse {
  pub invited_user: InvitedUserDetails,
  pub referrer_user: ReferrerUserDetails,
  pub maybe_referral_code_token: Option<UserReferralCodeToken>,
  pub maybe_referral_url: Option<String>,
  pub maybe_landing_url: Option<String>,
  pub created_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct InvitedUserDetails {
  pub token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_address: String,
}

#[derive(Serialize, ToSchema)]
pub struct ReferrerUserDetails {
  pub token: UserToken,
  pub username: String,
  pub display_name: String,
}
