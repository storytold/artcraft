use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::{GenerateSeedance10LiteImageToVideoRequest, GenerateSeedance10LiteImageToVideoResponse, GENERATE_SEEDANCE_1_0_LITE_IMAGE_TO_VIDEO_URL_PATH};

pub async fn generate_seedance_1_0_lite_image_to_video(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateSeedance10LiteImageToVideoRequest,
) -> Result<GenerateSeedance10LiteImageToVideoResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_SEEDANCE_1_0_LITE_IMAGE_TO_VIDEO_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
