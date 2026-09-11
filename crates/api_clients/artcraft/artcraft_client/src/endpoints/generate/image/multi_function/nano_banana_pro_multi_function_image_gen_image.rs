use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::{NanoBananaProMultiFunctionImageGenRequest, NanoBananaProMultiFunctionImageGenResponse, NANO_BANANA_PRO_MULTI_FUNCTION_IMAGE_GEN_PATH};

pub async fn nano_banana_pro_multi_function_image_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: NanoBananaProMultiFunctionImageGenRequest,
) -> Result<NanoBananaProMultiFunctionImageGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    NANO_BANANA_PRO_MULTI_FUNCTION_IMAGE_GEN_PATH,
    maybe_creds,
    request,
  ).await?)
}
