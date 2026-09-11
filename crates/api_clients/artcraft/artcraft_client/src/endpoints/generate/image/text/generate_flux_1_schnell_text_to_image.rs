use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::{GenerateFlux1SchnellTextToImageRequest, GenerateFlux1SchnellTextToImageResponse, GENERATE_FLUX_1_SCHNELL_TEXT_TO_IMAGE_PATH};


pub async fn generate_flux_1_schnell_text_to_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateFlux1SchnellTextToImageRequest,
) -> Result<GenerateFlux1SchnellTextToImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_FLUX_1_SCHNELL_TEXT_TO_IMAGE_PATH,
    maybe_creds,
    request,
  ).await?)
}
