use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::OmniGenVideoGenerateResponse;

pub const OMNI_GEN_VIDEO_GENERATE_PATH: &str = "/v1/omni_gen/generate/video";

pub async fn omni_gen_video_generate(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: OmniGenVideoCostAndGenerateRequest,
) -> Result<OmniGenVideoGenerateResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    OMNI_GEN_VIDEO_GENERATE_PATH,
    maybe_creds,
    request,
  ).await?)
}
