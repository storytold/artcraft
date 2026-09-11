use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::multi_function::veo_3p1_multi_function_video_gen::{Veo3p1MultiFunctionVideoGenRequest, Veo3p1MultiFunctionVideoGenResponse, VEO_3P1_MULTI_FUNCTION_VIDEO_VIDEO_PATH};

pub async fn veo_3p1_multi_function_video_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Veo3p1MultiFunctionVideoGenRequest,
) -> Result<Veo3p1MultiFunctionVideoGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    VEO_3P1_MULTI_FUNCTION_VIDEO_VIDEO_PATH,
    maybe_creds,
    request,
  ).await?)
}
