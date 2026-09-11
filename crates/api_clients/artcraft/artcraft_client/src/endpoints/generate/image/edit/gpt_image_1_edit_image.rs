use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{GptImage1EditImageRequest, GptImage1EditImageResponse, GPT_IMAGE_1_EDIT_IMAGE_PATH};


pub async fn gpt_image_1_edit_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GptImage1EditImageRequest,
) -> Result<GptImage1EditImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GPT_IMAGE_1_EDIT_IMAGE_PATH,
    maybe_creds,
    request,
  ).await?)
}
