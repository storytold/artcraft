use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_splat_generate_response::OmniGenSplatGenerateResponse;

pub const OMNI_GEN_SPLAT_GENERATE_PATH: &str = "/v1/omni_gen/generate/splat";

pub async fn omni_gen_splat_generate(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: OmniGenSplatCostAndGenerateRequest,
) -> Result<OmniGenSplatGenerateResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    OMNI_GEN_SPLAT_GENERATE_PATH,
    maybe_creds,
    request,
  ).await?)
}
