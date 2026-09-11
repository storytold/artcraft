use chrono::{DateTime, Utc};
use enums::common::payments_namespace::PaymentsNamespace;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::user_subscriptions::UserSubscriptionToken;
use utoipa::ToSchema;

// TODO: Maybe make "artcraft_subscription" or "fakeyou_subscription" with strongly typed slugs?

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GetSessionSubscriptionResponse {
  pub success: bool,

  /// Information about the user's subscription, if any.
  pub active_subscription: Option<SubscriptionInfo>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct SubscriptionInfo {
  /// Unique token for the subscription.
  pub subscription_token: UserSubscriptionToken,

  /// Namespace for the subscription.
  pub namespace: PaymentsNamespace,

  /// Local key for the subscription.
  pub product_slug: String,
  
  /// If the subscription is currently active, this is the next billing date.
  pub next_bill_at: Option<DateTime<Utc>>,
  
  /// If the subscription is set to cancel, this is the end date of the subscription.
  pub subscription_end_at: Option<DateTime<Utc>>,
  
  ///// When the current billing period ends (either 
  ///// auto-renew/rebill date or auto-cancel/cancellation date).
  //pub current_billing_period_end_at: DateTime<Utc>,
}
