use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_plus_splat::{GenerateWorldlabsMarble0p1PlusSplatRequest, GenerateWorldlabsMarble0p1PlusSplatResponse, GENERATE_WORLDLABS_MARBLE_0P1_PLUS_SPLAT_URL_PATH};

pub async fn generate_worldlabs_marble_0p1_plus_splat(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateWorldlabsMarble0p1PlusSplatRequest,
) -> Result<GenerateWorldlabsMarble0p1PlusSplatResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_WORLDLABS_MARBLE_0P1_PLUS_SPLAT_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
