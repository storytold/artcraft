use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::{GenerateKling16ProImageToVideoRequest, GenerateKling16ProImageToVideoResponse, GENERATE_KLING_1_6_PRO_IMAGE_TO_VIDEO_URL_PATH};

pub async fn generate_kling_16_pro_image_to_video(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateKling16ProImageToVideoRequest,
) -> Result<GenerateKling16ProImageToVideoResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_KLING_1_6_PRO_IMAGE_TO_VIDEO_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
