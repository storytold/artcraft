use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::bg_removal::remove_image_background::{RemoveImageBackgroundRequest, RemoveImageBackgroundResponse, REMOVE_IMAGE_BACKGROUND_PATH};

pub async fn remove_image_background(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: RemoveImageBackgroundRequest,
) -> Result<RemoveImageBackgroundResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    REMOVE_IMAGE_BACKGROUND_PATH,
    maybe_creds,
    request,
  ).await?)
}
