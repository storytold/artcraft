use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{Seedance2p0MultiFunctionVideoGenRequest, Seedance2p0MultiFunctionVideoGenResponse, SEEDANCE_2P0_MULTI_FUNCTION_VIDEO_GEN_PATH};

pub async fn seedance_2p0_multi_function_video_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Seedance2p0MultiFunctionVideoGenRequest,
) -> Result<Seedance2p0MultiFunctionVideoGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    SEEDANCE_2P0_MULTI_FUNCTION_VIDEO_GEN_PATH,
    maybe_creds,
    request,
  ).await?)
}
