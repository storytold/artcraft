use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::{IntoParams, ToSchema};

pub const MODERATOR_TOP_USERS_LIST_PATH: &str =
  "/v1/moderation/user_spend_summaries/top_users_list";

/// Net-spend window that selects which column `top_users_list` sorts by.
#[derive(Deserialize, Serialize, Clone, Copy, ToSchema)]
pub enum TopUsersWindow {
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
  #[serde(rename = "1y")]
  OneYear,
  #[serde(rename = "lifetime")]
  Lifetime,
}

impl TopUsersWindow {
  /// The `window` key the `list_top_users_by_net_spend` query matches on.
  pub fn as_query_key(self) -> &'static str {
    match self {
      TopUsersWindow::SevenDays => "7d",
      TopUsersWindow::FourteenDays => "14d",
      TopUsersWindow::ThirtyDays => "30d",
      TopUsersWindow::SixtyDays => "60d",
      TopUsersWindow::NinetyDays => "90d",
      TopUsersWindow::OneYear => "1y",
      TopUsersWindow::Lifetime => "lifetime",
    }
  }
}

#[derive(Deserialize, IntoParams)]
pub struct ModeratorTopUsersListQueryParams {
  /// Sort window: `7d`, `14d`, `30d`, `60d`, `90d`, `1y`, or `lifetime` (default).
  pub window: Option<TopUsersWindow>,
  /// Row offset for pagination (page size is fixed at 200). Pass `next_offset` from the previous page.
  pub offset: Option<u64>,
  /// Payments namespace. Defaults to `artcraft`.
  pub payments_namespace: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorTopUsersListResponse {
  pub success: bool,
  /// The window that was sorted by (echo of the request).
  pub window: String,
  pub users: Vec<TopUserEntry>,
  /// Offset for the next page, or `None` if this was the last page.
  pub maybe_next_offset: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct TopUserEntry {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  pub lifetime_net_spend_usd_cents: u64,
  pub net_spend_7d_usd_cents: i64,
  pub net_spend_14d_usd_cents: i64,
  pub net_spend_30d_usd_cents: i64,
  pub net_spend_60d_usd_cents: i64,
  pub net_spend_90d_usd_cents: i64,
  pub net_spend_this_year_usd_cents: i64,
  pub is_active_subscriber: bool,
  pub maybe_reengagement_score: Option<u32>,
}
