use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::multi_function::veo_3p1_fast_multi_function_video_gen::{Veo3p1FastMultiFunctionVideoGenRequest, Veo3p1FastMultiFunctionVideoGenResponse, VEO_3P1_FAST_MULTI_FUNCTION_VIDEO_VIDEO_PATH};

pub async fn veo_3p1_fast_multi_function_video_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Veo3p1FastMultiFunctionVideoGenRequest,
) -> Result<Veo3p1FastMultiFunctionVideoGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    VEO_3P1_FAST_MULTI_FUNCTION_VIDEO_VIDEO_PATH,
    maybe_creds,
    request,
  ).await?)
}
