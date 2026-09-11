use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::inpaint::flux_dev_juggernaut_inpaint_image::{FluxDevJuggernautInpaintImageRequest, FluxDevJuggernautInpaintImageResponse, FLUX_DEV_JUGGERNAUT_INPAINT_PATH};

pub async fn flux_dev_juggernaut_inpaint_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: FluxDevJuggernautInpaintImageRequest,
) -> Result<FluxDevJuggernautInpaintImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    FLUX_DEV_JUGGERNAUT_INPAINT_PATH,
    maybe_creds,
    request,
  ).await?)
}
