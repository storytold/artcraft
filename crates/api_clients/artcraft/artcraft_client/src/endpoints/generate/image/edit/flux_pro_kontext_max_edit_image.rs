use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::edit::flux_pro_kontext_max_edit_image::{FluxProKontextMaxEditImageRequest, FluxProKontextMaxEditImageResponse, FLUX_PRO_KONTEXT_MAX_EDIT_IMAGE_PATH};


pub async fn flux_pro_kontext_max_edit_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: FluxProKontextMaxEditImageRequest,
) -> Result<FluxProKontextMaxEditImageResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    FLUX_PRO_KONTEXT_MAX_EDIT_IMAGE_PATH,
    maybe_creds,
    request,
  ).await?)
}
