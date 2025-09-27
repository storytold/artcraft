use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::generate_veo_3_image_to_video::{GenerateVeo3ImageToVideoRequest, GenerateVeo3ImageToVideoResponse, GENERATE_VEO_3_IMAGE_TO_VIDEO_URL_PATH};

pub async fn generate_veo_3_image_to_video(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateVeo3ImageToVideoRequest,
) -> Result<GenerateVeo3ImageToVideoResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_VEO_3_IMAGE_TO_VIDEO_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
