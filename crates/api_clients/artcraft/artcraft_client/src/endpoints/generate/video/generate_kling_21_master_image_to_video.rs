use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::{GenerateKling21MasterImageToVideoRequest, GenerateKling21MasterImageToVideoResponse, GENERATE_KLING_2_1_MASTER_IMAGE_TO_VIDEO_URL_PATH};

pub async fn generate_kling_21_master_image_to_video(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateKling21MasterImageToVideoRequest,
) -> Result<GenerateKling21MasterImageToVideoResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_KLING_2_1_MASTER_IMAGE_TO_VIDEO_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
