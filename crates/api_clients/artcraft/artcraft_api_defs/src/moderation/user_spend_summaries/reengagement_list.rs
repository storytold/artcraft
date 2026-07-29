use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::{IntoParams, ToSchema};

pub const MODERATOR_REENGAGEMENT_LIST_PATH: &str =
  "/v1/moderation/user_spend_summaries/reengagement_list";

#[derive(Deserialize, IntoParams)]
pub struct ModeratorReengagementListQueryParams {
  /// Row offset for pagination (page size is fixed at 200). Pass `next_offset` from the previous page.
  pub offset: Option<u64>,
  /// Payments namespace. Defaults to `artcraft`.
  pub payments_namespace: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorReengagementListResponse {
  pub success: bool,
  pub candidates: Vec<ReengagementCandidateEntry>,
  /// Offset for the next page, or `None` if this was the last page.
  pub maybe_next_offset: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct ReengagementCandidateEntry {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  pub reengagement_score: u32,
  pub lifetime_net_spend_usd_cents: u64,
  pub maybe_last_payment_at: Option<DateTime<Utc>>,
  pub maybe_days_since_last_payment: Option<u32>,
  pub maybe_weeks_since_last_spend: Option<u32>,
  pub is_active_subscriber: bool,
}
