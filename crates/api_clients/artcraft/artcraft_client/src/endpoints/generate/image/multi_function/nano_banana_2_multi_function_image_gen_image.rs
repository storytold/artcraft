use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::multi_function::nano_banana_2_multi_function_image_gen::{NanaBanana2MultiFunctionImageGenRequest, NanaBanana2MultiFunctionImageGenResponse, NANO_BANANA_2_MULTI_FUNCTION_IMAGE_GEN_PATH};

pub async fn nano_banana_2_multi_function_image_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: NanaBanana2MultiFunctionImageGenRequest,
) -> Result<NanaBanana2MultiFunctionImageGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    NANO_BANANA_2_MULTI_FUNCTION_IMAGE_GEN_PATH,
    maybe_creds,
    request,
  ).await?)
}
