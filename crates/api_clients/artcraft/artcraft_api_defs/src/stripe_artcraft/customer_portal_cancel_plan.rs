use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CUSTOMER_PORTAL_CANCEL_PLAN_URL_PATH: &str = "/v1/stripe_artcraft/portal/cancel_plan";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCustomerPortalCancelPlanRequest {
  // TODO: Not sure if this is needed
  pub portal_config_id: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCustomerPortalCancelPlanResponse {
  pub success: bool,
  pub stripe_portal_url: String,
}

