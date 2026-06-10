use enums::common::payments_namespace::PaymentsNamespace;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;

pub const MODERATOR_GET_USER_STRIPE_CUSTOMER_IDS_PATH: &str =
    "/v1/moderation/user_stripe_data/{user_token}/customer_ids";

#[derive(Deserialize, ToSchema)]
pub struct ModeratorGetUserStripeCustomerIdsPathInfo {
  pub user_token: UserToken,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorGetUserStripeCustomerIdsResponse {
  pub success: bool,

  /// All stripe customer ids we have on file for the user, across payments
  /// namespaces. A user may have zero or several: a customer link and/or
  /// subscriptions per namespace (eg. artcraft), plus legacy fakeyou
  /// subscriptions. The same customer id can appear once per source.
  pub customer_ids: Vec<ModeratorUserStripeCustomerIdEntry>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorUserStripeCustomerIdEntry {
  pub stripe_customer_id: String,
  pub payments_namespace: PaymentsNamespace,
  pub source: ModeratorStripeCustomerIdSource,

  /// Link to the customer in the Stripe dashboard for the namespace's account.
  pub stripe_dashboard_url: String,
}

/// Which table the customer id was found in.
#[derive(Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ModeratorStripeCustomerIdSource {
  /// From the `user_stripe_customer_links` table (1:1 per namespace).
  CustomerLink,
  /// From the user's rows in the `user_subscriptions` table.
  Subscription,
}
