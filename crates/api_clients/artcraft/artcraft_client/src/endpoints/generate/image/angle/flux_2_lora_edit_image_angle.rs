use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::angle::flux_2_lora_edit_image_angle::{
  Flux2LoraEditImageAngleRequest, Flux2LoraEditImageAngleResponse,
  FLUX_2_LORA_EDIT_IMAGE_ANGLE_PATH,
};

pub async fn flux_2_lora_edit_image_angle(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Flux2LoraEditImageAngleRequest,
) -> Result<Flux2LoraEditImageAngleResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    FLUX_2_LORA_EDIT_IMAGE_ANGLE_PATH,
    maybe_creds,
    request,
  ).await?)
}
