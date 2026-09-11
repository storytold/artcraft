use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::text::generate_flux_1_dev_text_to_image::{GenerateFlux1DevTextToImageRequest, GenerateFlux1DevTextToImageResponse, GENERATE_FLUX_1_DEV_TEXT_TO_IMAGE_PATH};


pub async fn generate_flux_1_dev_text_to_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateFlux1DevTextToImageRequest,
) -> Result<GenerateFlux1DevTextToImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_FLUX_1_DEV_TEXT_TO_IMAGE_PATH,
    maybe_creds,
    request,
  ).await?)
}
