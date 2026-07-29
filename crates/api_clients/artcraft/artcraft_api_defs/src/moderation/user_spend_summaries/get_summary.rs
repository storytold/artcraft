use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::{IntoParams, ToSchema};

pub const MODERATOR_GET_USER_SPEND_SUMMARY_PATH: &str =
  "/v1/moderation/user_spend_summaries/summary/{user_token}";

#[derive(Deserialize, IntoParams)]
pub struct ModeratorGetUserSpendSummaryQueryParams {
  /// Payments namespace. Defaults to `artcraft`.
  pub payments_namespace: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorGetUserSpendSummaryResponse {
  pub success: bool,
  /// `None` if the user has no spend summary row.
  pub maybe_summary: Option<UserSpendSummaryView>,
}

/// The full `user_spend_summaries` record for a user.
#[derive(Serialize, ToSchema)]
pub struct UserSpendSummaryView {
  pub payments_namespace: String,
  pub user_token: UserToken,

  pub lifetime_gross_spend_usd_cents: u64,
  pub lifetime_subscription_spend_usd_cents: u64,
  pub lifetime_credits_spend_usd_cents: u64,
  pub lifetime_refund_usd_cents: u64,
  pub lifetime_net_spend_usd_cents: u64,
  pub lifetime_payment_count: u32,
  pub lifetime_refund_count: u32,
  pub maybe_first_payment_at: Option<DateTime<Utc>>,
  pub first_spend_usd_cents: u64,
  pub maybe_last_payment_at: Option<DateTime<Utc>>,
  pub last_spend_usd_cents: u64,
  pub maybe_days_since_first_payment: Option<u32>,
  pub maybe_days_since_last_payment: Option<u32>,

  pub net_spend_7d_usd_cents: i64,
  pub net_spend_prev_7d_usd_cents: i64,
  pub net_spend_14d_usd_cents: i64,
  pub net_spend_prev_14d_usd_cents: i64,
  pub net_spend_30d_usd_cents: i64,
  pub net_spend_prev_30d_usd_cents: i64,
  pub net_spend_60d_usd_cents: i64,
  pub net_spend_90d_usd_cents: i64,
  pub net_spend_this_year_usd_cents: i64,

  pub avg_weekly_net_spend_4w_usd_cents: i64,
  pub avg_weekly_net_spend_12w_usd_cents: i64,
  pub active_weeks_in_last_4: u8,
  pub active_weeks_in_last_8: u8,
  pub active_weeks_in_last_12: u8,
  pub active_weeks_in_last_24: u8,
  pub active_weeks_in_last_52: u8,
  pub consecutive_active_weeks: u32,
  pub consecutive_inactive_weeks: u32,
  pub maybe_weeks_since_last_spend: Option<u32>,

  pub is_active_subscriber: bool,
  pub maybe_subscription_interval: Option<String>,
  pub maybe_reengagement_score: Option<u32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
