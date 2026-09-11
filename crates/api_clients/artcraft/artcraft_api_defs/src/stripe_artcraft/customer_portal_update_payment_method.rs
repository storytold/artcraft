use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CUSTOMER_PORTAL_UPDATE_PAYMENT_METHOD_URL_PATH: &str = "/v1/stripe_artcraft/portal/update_payment_method";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCustomerPortalUpdatePaymentMethodRequest {
  // TODO: Not sure if this is needed
  pub portal_config_id: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCustomerPortalUpdatePaymentMethodResponse {
  pub success: bool,
  pub stripe_portal_url: String,
}

