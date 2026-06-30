use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::user_spend_events::UserSpendEventToken;
use tokens::tokens::users::UserToken;
use utoipa::{IntoParams, ToSchema};

pub const MODERATOR_LIST_USER_SPEND_EVENTS_PATH: &str =
  "/v1/moderation/user_spend_events/list";

#[derive(Deserialize, IntoParams)]
pub struct ModeratorListUserSpendEventsQueryParams {
  /// Row offset for pagination (page size is fixed at 200). Pass `next_offset` from the previous page.
  pub offset: Option<u64>,
  /// Optional namespace filter (e.g. `artcraft`). Omit to return all namespaces.
  pub payments_namespace: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorListUserSpendEventsResponse {
  pub success: bool,
  pub events: Vec<UserSpendEventListEntry>,
  /// Offset for the next page, or `None` if this was the last page.
  pub maybe_next_offset: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct UserSpendEventListEntry {
  pub token: UserSpendEventToken,
  pub payments_namespace: String,
  pub maybe_user_token: Option<UserToken>,
  pub maybe_username: Option<String>,
  pub maybe_display_name: Option<String>,
  pub maybe_email_gravatar_hash: Option<String>,
  pub event_type: String,
  pub amount_usd_cents: i64,
  pub maybe_credits_granted: Option<u32>,
  pub payment_source: String,
  pub maybe_source_object_id: Option<String>,
  pub maybe_stripe_invoice_id: Option<String>,
  pub maybe_stripe_payment_intent_id: Option<String>,
  pub maybe_stripe_charge_id: Option<String>,
  pub maybe_stripe_customer_id: Option<String>,
  pub is_production: bool,
  pub payment_occurred_at: DateTime<Utc>,
  pub created_at: DateTime<Utc>,
}
