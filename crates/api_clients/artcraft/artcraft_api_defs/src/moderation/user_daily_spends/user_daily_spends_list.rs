use chrono::{DateTime, NaiveDate, Utc};
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::{IntoParams, ToSchema};

pub const MODERATOR_USER_DAILY_SPENDS_PATH: &str =
  "/v1/moderation/user_daily_spends/user/{user_token}";

#[derive(Deserialize, IntoParams)]
pub struct ModeratorUserDailySpendsQueryParams {
  /// Page size (default 200, max 5000).
  pub limit: Option<u32>,
  /// Row offset for pagination. Pass `next_offset` from the previous page.
  pub offset: Option<u64>,
  /// Payments namespace. Defaults to `artcraft`.
  pub payments_namespace: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorUserDailySpendsResponse {
  pub success: bool,
  pub user_token: UserToken,
  pub records: Vec<UserDailySpendEntry>,
  /// Offset for the next page, or `None` if this was the last page.
  pub maybe_next_offset: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct UserDailySpendEntry {
  pub payments_namespace: String,
  pub spend_date: NaiveDate,
  pub subscription_spend_usd_cents: u64,
  pub credits_spend_usd_cents: u64,
  pub gross_spend_usd_cents: u64,
  pub refund_usd_cents: u64,
  pub net_spend_usd_cents: i64,
  pub payment_count: u32,
  pub credits_granted: u64,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
