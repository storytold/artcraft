use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::stripe_artcraft::customer_portal_update_payment_method::{StripeArtcraftCustomerPortalUpdatePaymentMethodRequest, StripeArtcraftCustomerPortalUpdatePaymentMethodResponse, CUSTOMER_PORTAL_UPDATE_PAYMENT_METHOD_URL_PATH};

pub async fn customer_portal_update_payment_method(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: StripeArtcraftCustomerPortalUpdatePaymentMethodRequest,
) -> Result<StripeArtcraftCustomerPortalUpdatePaymentMethodResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    CUSTOMER_PORTAL_UPDATE_PAYMENT_METHOD_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
