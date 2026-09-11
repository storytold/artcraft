use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::{GptImage1p5MultiFunctionImageGenRequest, GptImage1p5MultiFunctionImageGenResponse, GPT_IMAGE_1P5_MULTI_FUNCTION_IMAGE_GEN_PATH};

pub async fn gpt_image_1p5_multi_function_image_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GptImage1p5MultiFunctionImageGenRequest,
) -> Result<GptImage1p5MultiFunctionImageGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GPT_IMAGE_1P5_MULTI_FUNCTION_IMAGE_GEN_PATH,
    maybe_creds,
    request,
  ).await?)
}
