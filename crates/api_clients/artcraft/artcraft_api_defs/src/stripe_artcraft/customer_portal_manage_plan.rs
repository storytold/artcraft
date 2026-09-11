use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CUSTOMER_PORTAL_MANAGE_PLAN_URL_PATH: &str = "/v1/stripe_artcraft/portal/manage_plan";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCustomerPortalManagePlanRequest {
  // TODO: Not sure if this is needed
  pub portal_config_id: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCustomerPortalManagePlanResponse {
  pub success: bool,
  pub stripe_portal_url: String,
}

