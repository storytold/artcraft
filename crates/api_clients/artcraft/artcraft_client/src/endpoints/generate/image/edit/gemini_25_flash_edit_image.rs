use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::edit::gemini_25_flash_edit_image::{Gemini25FlashEditImageRequest, Gemini25FlashEditImageResponse, GEMINI_25_FLASH_EDIT_IMAGE_PATH};

pub async fn gemini_25_flash_edit_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Gemini25FlashEditImageRequest,
) -> Result<Gemini25FlashEditImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GEMINI_25_FLASH_EDIT_IMAGE_PATH,
    maybe_creds,
    request,
  ).await?)
}
