use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CUSTOMER_PORTAL_SWITCH_PLAN_URL_PATH: &str = "/v1/stripe_artcraft/portal/switch_plan";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCustomerPortalSwitchPlanRequest {
  // TODO: Not sure if this is needed
  pub portal_config_id: Option<String>,

  /// REQUIRED
  /// The plan we're switching to.
  pub plan: Option<ArtcraftSubscriptionSlug>,
  
  /// REQUIRED
  /// The cadence for the plan billing.
  pub cadence: Option<PlanBillingCadenceConfirmation>,
}


#[derive(Serialize, Deserialize, ToSchema, Debug, Copy, Clone)]
pub enum PlanBillingCadenceConfirmation {
  #[serde(rename = "monthly")]
  Monthly,

  #[serde(rename = "yearly")]
  Yearly,
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCustomerPortalSwitchPlanResponse {
  pub success: bool,
  pub stripe_portal_url: String,
}

