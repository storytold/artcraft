use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::{GenerateGptImage1TextToImageRequest, GenerateGptImage1TextToImageResponse, GPT_IMAGE_1_TEXT_TO_IMAGE_PATH};


pub async fn generate_gpt_image_1_text_to_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateGptImage1TextToImageRequest,
) -> Result<GenerateGptImage1TextToImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GPT_IMAGE_1_TEXT_TO_IMAGE_PATH,
    maybe_creds,
    request,
  ).await?)
}
