use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::angle::qwen_edit_2511_edit_image_angle::{
  QwenEdit2511EditImageAngleRequest, QwenEdit2511EditImageAngleResponse,
  QWEN_EDIT_2511_EDIT_IMAGE_ANGLE_PATH,
};

pub async fn qwen_edit_2511_edit_image_angle(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: QwenEdit2511EditImageAngleRequest,
) -> Result<QwenEdit2511EditImageAngleResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    QWEN_EDIT_2511_EDIT_IMAGE_ANGLE_PATH,
    maybe_creds,
    request,
  ).await?)
}
