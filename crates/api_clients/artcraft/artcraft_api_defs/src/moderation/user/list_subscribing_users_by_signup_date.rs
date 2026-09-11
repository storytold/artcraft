use chrono::{DateTime, Utc};
use enums::by_table::users::user_signup_method::UserSignupMethod;
use enums::by_table::users::user_signup_source::UserSignupSource;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;

pub const MODERATOR_LIST_SUBSCRIBING_USERS_BY_SIGNUP_DATE_PATH: &str = "/v1/moderation/users/list_subscribers_by_signup_date";

#[derive(Deserialize, ToSchema)]
pub struct ModeratorListSubscribingUsersBySignupDateRequest {
  /// Optional cursor for pagination. Pass the `next_cursor` from a previous response.
  pub id_cursor: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorListSubscribingUsersBySignupDateResponse {
  pub success: bool,
  pub users: Vec<ModeratorListSubscribingUsersBySignupDateEntry>,
  /// The cursor for the next page. `None` if there are no more results.
  pub next_cursor: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorListSubscribingUsersBySignupDateEntry {
  // -- User fields --
  pub id: u64,
  pub token: UserToken,
  pub username: String,
  pub display_name: String,
  pub username_is_not_customized: bool,
  pub email_address: String,
  pub email_confirmed: bool,
  pub is_without_password: bool,
  pub ip_address_creation: String,
  pub maybe_source: Option<UserSignupSource>,
  pub maybe_signup_method: Option<UserSignupMethod>,
  pub created_at: DateTime<Utc>,
  pub maybe_referral_url: Option<String>,
  pub is_temporary: bool,

  // TODO: Use enum types/strong types - 
  // -- Subscription fields --
  pub subscription_namespace: String,
  pub subscription_product_slug: String,
  pub maybe_stripe_subscription_id: Option<String>,
  pub maybe_stripe_customer_id: Option<String>,
  pub maybe_stripe_product_id: Option<String>,
  pub maybe_stripe_price_id: Option<String>,
  pub maybe_stripe_subscription_status: Option<String>,
  pub maybe_stripe_recurring_interval: Option<String>,
  pub maybe_stripe_invoice_is_paid: Option<bool>,
  pub maybe_cancel_at: Option<DateTime<Utc>>,
  pub maybe_canceled_at: Option<DateTime<Utc>>,
}
