use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_mini_splat::{GenerateWorldlabsMarble0p1MiniSplatRequest, GenerateWorldlabsMarble0p1MiniSplatResponse, GENERATE_WORLDLABS_MARBLE_0P1_MINI_SPLAT_URL_PATH};

pub async fn generate_worldlabs_marble_0p1_mini_splat(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateWorldlabsMarble0p1MiniSplatRequest,
) -> Result<GenerateWorldlabsMarble0p1MiniSplatResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_WORLDLABS_MARBLE_0P1_MINI_SPLAT_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
