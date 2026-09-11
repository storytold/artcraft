use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::stripe_artcraft::customer_portal_switch_plan::{StripeArtcraftCustomerPortalSwitchPlanRequest, StripeArtcraftCustomerPortalSwitchPlanResponse, CUSTOMER_PORTAL_SWITCH_PLAN_URL_PATH};

pub async fn customer_portal_switch_plan(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: StripeArtcraftCustomerPortalSwitchPlanRequest,
) -> Result<StripeArtcraftCustomerPortalSwitchPlanResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    CUSTOMER_PORTAL_SWITCH_PLAN_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
