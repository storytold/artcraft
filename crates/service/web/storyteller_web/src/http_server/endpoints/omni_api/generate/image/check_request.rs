use artcraft_api_defs::omni_api::generate_requests::omni_api_image_generate_request::OmniApiImageGenerateRequest;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_api::shared_utils::check_url_inputs::{check_mutually_exclusive, check_url_format};

/// Validate the URL/media-token preconditions before any billable or
/// DB-mutating work:
///   1. A media-token field and its paired URL field are mutually exclusive.
///   2. Every supplied URL starts with `http://` or `https://`.
pub fn check_request(request: &OmniApiImageGenerateRequest) -> Result<(), CommonWebError> {
  check_mutually_exclusive(
    "image_media_tokens",
    request.image_media_tokens.is_some(),
    "image_urls",
    request.image_urls.is_some(),
  )?;

  check_url_format(request.image_urls.as_deref())?;

  Ok(())
}
