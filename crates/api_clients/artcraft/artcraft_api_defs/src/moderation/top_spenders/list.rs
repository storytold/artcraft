use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::{IntoParams, ToSchema};

pub const MODERATOR_LIST_TOP_SPENDERS_PATH: &str =
  "/v1/moderation/top_spenders/list";

/// Rolling aggregation window for the top spenders list.
#[derive(Deserialize, Serialize, Clone, Copy, ToSchema)]
pub enum TopSpendersWindow {
  #[serde(rename = "24h")]
  TwentyFourHours,
  #[serde(rename = "7d")]
  SevenDays,
  #[serde(rename = "14d")]
  FourteenDays,
  #[serde(rename = "30d")]
  ThirtyDays,
  #[serde(rename = "60d")]
  SixtyDays,
  #[serde(rename = "90d")]
  NinetyDays,
  #[serde(rename = "180d")]
  OneHundredEightyDays,
  #[serde(rename = "365d")]
  ThreeHundredSixtyFiveDays,
}

impl TopSpendersWindow {
  /// Window length in hours.
  pub fn as_hours(self) -> i64 {
    match self {
      TopSpendersWindow::TwentyFourHours => 24,
      TopSpendersWindow::SevenDays => 7 * 24,
      TopSpendersWindow::FourteenDays => 14 * 24,
      TopSpendersWindow::ThirtyDays => 30 * 24,
      TopSpendersWindow::SixtyDays => 60 * 24,
      TopSpendersWindow::NinetyDays => 90 * 24,
      TopSpendersWindow::OneHundredEightyDays => 180 * 24,
      TopSpendersWindow::ThreeHundredSixtyFiveDays => 365 * 24,
    }
  }
}

#[derive(Deserialize, IntoParams)]
pub struct ModeratorListTopSpendersQueryParams {
  /// Aggregation window: `24h`, `7d`, `14d`, `30d` (default), `60d`, `90d`,
  /// `180d`, or `365d`.
  pub window: Option<TopSpendersWindow>,
  /// Row offset for pagination (page size is fixed at 100). Pass `next_offset` from the previous page.
  pub offset: Option<u64>,
  /// Optional namespace filter (e.g. `artcraft`). Omit to return all namespaces.
  pub payments_namespace: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorListTopSpendersResponse {
  pub success: bool,
  /// The window the results were aggregated over (echoed back, post-default).
  pub window: TopSpendersWindow,
  pub spenders: Vec<TopSpenderEntry>,
  /// Offset for the next page, or `None` if this was the last page.
  pub maybe_next_offset: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct TopSpenderEntry {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  /// Sum of positive amounts in the window.
  pub gross_spend_usd_cents: u64,
  /// Refund/chargeback magnitude in the window (positive number).
  pub refund_usd_cents: u64,
  /// Gross minus refunds. Can be negative if refunds outweigh purchases.
  pub net_spend_usd_cents: i64,
  /// Number of positive money events in the window.
  pub payment_count: u64,
  /// Credits granted in the window.
  pub credits_granted: u64,
}
