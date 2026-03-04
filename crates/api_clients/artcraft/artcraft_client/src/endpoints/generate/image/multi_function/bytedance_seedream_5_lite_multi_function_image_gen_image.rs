use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_5_lite_multi_function_image_gen::{BytedanceSeedream5LiteMultiFunctionImageGenRequest, BytedanceSeedream5LiteMultiFunctionImageGenResponse, BYTEDANCE_SEEDREAM_5_LITE_MULTI_FUNCTION_IMAGE_GEN_PATH};

pub async fn bytedance_seedream_5_lite_multi_function_image_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: BytedanceSeedream5LiteMultiFunctionImageGenRequest,
) -> Result<BytedanceSeedream5LiteMultiFunctionImageGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    BYTEDANCE_SEEDREAM_5_LITE_MULTI_FUNCTION_IMAGE_GEN_PATH,
    maybe_creds,
    request,
  ).await?)
}
