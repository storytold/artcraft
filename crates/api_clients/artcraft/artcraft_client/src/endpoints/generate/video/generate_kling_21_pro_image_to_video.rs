use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::{GenerateKling21ProImageToVideoRequest, GenerateKling21ProImageToVideoResponse, GENERATE_KLING_2_1_PRO_IMAGE_TO_VIDEO_URL_PATH};

pub async fn generate_kling_21_pro_image_to_video(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateKling21ProImageToVideoRequest,
) -> Result<GenerateKling21ProImageToVideoResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_KLING_2_1_PRO_IMAGE_TO_VIDEO_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
