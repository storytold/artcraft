use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::inpaint::flux_pro_1_inpaint_image::{FluxPro1InpaintImageRequest, FluxPro1InpaintImageResponse, FLUX_PRO_1_INPAINT_PATH};

pub async fn flux_pro_1_inpaint_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: FluxPro1InpaintImageRequest,
) -> Result<FluxPro1InpaintImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    FLUX_PRO_1_INPAINT_PATH,
    maybe_creds,
    request,
  ).await?)
}
