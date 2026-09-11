use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::stripe_artcraft::create_credits_pack_checkout::{StripeArtcraftCreateCreditsPackCheckoutRequest, StripeArtcraftCreateCreditsPackCheckoutResponse, CREATE_CREDITS_PACK_CHECKOUT_URL_PATH};

pub async fn create_credits_pack_checkout(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: StripeArtcraftCreateCreditsPackCheckoutRequest,
) -> Result<StripeArtcraftCreateCreditsPackCheckoutResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    CREATE_CREDITS_PACK_CHECKOUT_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
