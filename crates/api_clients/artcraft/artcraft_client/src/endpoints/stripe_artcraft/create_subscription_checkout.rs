use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{StripeArtcraftCreateSubscriptionCheckoutRequest, StripeArtcraftCreateSubscriptionCheckoutResponse, CREATE_SUBSCRIPTION_CHECKOUT_URL_PATH};

pub async fn create_subscription_checkout(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: StripeArtcraftCreateSubscriptionCheckoutRequest,
) -> Result<StripeArtcraftCreateSubscriptionCheckoutResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    CREATE_SUBSCRIPTION_CHECKOUT_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
