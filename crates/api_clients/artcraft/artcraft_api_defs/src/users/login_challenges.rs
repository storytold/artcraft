use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, Serialize, ToSchema)]
pub struct CreateLoginChallengeRequest {}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct ReviewLoginChallengeRequest {
  pub approval_token: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct DecideLoginChallengeRequest {
  pub approval_token: String,
  pub approve: bool,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct PollLoginChallengeRequest {
  pub device_token: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct CreateLoginChallengeResponse {
  pub success: bool,
  pub device_token: String,
  pub verification_url: String,
  pub confirmation_code: String,
  pub expires_at: DateTime<Utc>,
  pub poll_interval_seconds: u32,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct ReviewLoginChallengeResponse {
  pub success: bool,
  pub status: LoginChallengeState,
  pub maybe_failure_type: Option<LoginChallengeFailure>,
  pub confirmation_code: String,
  pub requesting_ip: String,
  pub expires_at: DateTime<Utc>,
  pub username: String,
}

#[derive(Deserialize, Serialize, ToSchema)]
pub struct LoginChallengeResponse {
  pub success: bool,
  pub status: LoginChallengeState,
  pub maybe_failure_type: Option<LoginChallengeFailure>,
  /// Present only to the device after the redemption transaction commits.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_signed_session: Option<String>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum LoginChallengeState {
  Pending,
  Approved,
  Redeemed,
  Failed,
  #[serde(other)]
  Unknown,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum LoginChallengeFailure {
  UserDeclined,
  Expired,
  #[serde(other)]
  Unknown,
}
