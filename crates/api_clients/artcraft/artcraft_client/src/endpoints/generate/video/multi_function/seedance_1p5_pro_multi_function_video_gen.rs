use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::{Seedance1p5ProMultiFunctionVideoGenRequest, Seedance1p5ProMultiFunctionVideoGenResponse, SEEDANCE_1P5_PRO_MULTI_FUNCTION_VIDEO_GEN_PATH};

pub async fn seedance_1p5_pro_multi_function_video_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Seedance1p5ProMultiFunctionVideoGenRequest,
) -> Result<Seedance1p5ProMultiFunctionVideoGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    SEEDANCE_1P5_PRO_MULTI_FUNCTION_VIDEO_GEN_PATH,
    maybe_creds,
    request,
  ).await?)
}
