use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_ultra_text_to_image::{GenerateFluxPro11UltraTextToImageRequest, GenerateFluxPro11UltraTextToImageResponse, GENERATE_FLUX_PRO_11_ULTRA_TEXT_TO_IMAGE_PATH};

pub async fn generate_flux_pro_11_ultra_text_to_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateFluxPro11UltraTextToImageRequest,
) -> Result<GenerateFluxPro11UltraTextToImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_FLUX_PRO_11_ULTRA_TEXT_TO_IMAGE_PATH,
    maybe_creds,
    request,
  ).await?)
}
