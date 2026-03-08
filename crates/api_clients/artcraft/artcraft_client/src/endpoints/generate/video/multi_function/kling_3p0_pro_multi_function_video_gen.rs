use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::multi_function::kling_3p0_pro_multi_function_video_gen::{Kling3p0ProMultiFunctionVideoGenRequest, Kling3p0ProMultiFunctionVideoGenResponse, KLING_3P0_PRO_MULTI_FUNCTION_VIDEO_PATH};

pub async fn kling_3p0_pro_multi_function_video_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Kling3p0ProMultiFunctionVideoGenRequest,
) -> Result<Kling3p0ProMultiFunctionVideoGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    KLING_3P0_PRO_MULTI_FUNCTION_VIDEO_PATH,
    maybe_creds,
    request,
  ).await?)
}
