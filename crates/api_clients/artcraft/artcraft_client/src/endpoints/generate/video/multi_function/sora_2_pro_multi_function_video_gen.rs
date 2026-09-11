use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::multi_function::sora_2_pro_multi_function_video_gen::{Sora2ProMultiFunctionVideoGenRequest, Sora2ProMultiFunctionVideoGenResponse, SORA_2_PRO_MULTI_FUNCTION_VIDEO_VIDEO_PATH};

pub async fn sora_2_pro_multi_function_video_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Sora2ProMultiFunctionVideoGenRequest,
) -> Result<Sora2ProMultiFunctionVideoGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    SORA_2_PRO_MULTI_FUNCTION_VIDEO_VIDEO_PATH,
    maybe_creds,
    request,
  ).await?)
}
