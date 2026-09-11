use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::multi_function::kling_2_5_turbo_multi_function_video_gen::{Kling2p5TurboProMultiFunctionVideoGenRequest, Kling2p5TurboProMultiFunctionVideoGenResponse, KLING_2P5_TURBO_PRO_MULTI_FUNCTION_VIDEO_VIDEO_PATH};

pub async fn kling_2p5_turbo_pro_multi_function_video_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Kling2p5TurboProMultiFunctionVideoGenRequest,
) -> Result<Kling2p5TurboProMultiFunctionVideoGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    KLING_2P5_TURBO_PRO_MULTI_FUNCTION_VIDEO_VIDEO_PATH,
    maybe_creds,
    request,
  ).await?)
}
