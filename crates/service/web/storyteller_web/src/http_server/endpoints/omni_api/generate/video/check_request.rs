use artcraft_api_defs::omni_api::generate_requests::omni_api_video_generate_request::OmniApiVideoGenerateRequest;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_api::shared_utils::check_url_inputs::{check_mutually_exclusive, check_single_url_format, check_url_format};

/// Validate the URL/media-token preconditions before any billable or
/// DB-mutating work:
///   1. Each media-token field and its paired URL field are mutually exclusive.
///   2. Every supplied URL starts with `http://` or `https://`.
pub fn check_request(request: &OmniApiVideoGenerateRequest) -> Result<(), CommonWebError> {
  check_mutually_exclusive(
    "start_frame_image_media_token",
    request.start_frame_image_media_token.is_some(),
    "start_frame_image_url",
    request.start_frame_image_url.is_some(),
  )?;
  check_mutually_exclusive(
    "end_frame_image_media_token",
    request.end_frame_image_media_token.is_some(),
    "end_frame_image_url",
    request.end_frame_image_url.is_some(),
  )?;
  check_mutually_exclusive(
    "reference_image_media_tokens",
    request.reference_image_media_tokens.is_some(),
    "reference_image_urls",
    request.reference_image_urls.is_some(),
  )?;
  check_mutually_exclusive(
    "reference_video_media_tokens",
    request.reference_video_media_tokens.is_some(),
    "reference_video_urls",
    request.reference_video_urls.is_some(),
  )?;
  check_mutually_exclusive(
    "reference_audio_media_tokens",
    request.reference_audio_media_tokens.is_some(),
    "reference_audio_urls",
    request.reference_audio_urls.is_some(),
  )?;

  if let Some(url) = request.start_frame_image_url.as_deref() {
    check_single_url_format(url)?;
  }
  if let Some(url) = request.end_frame_image_url.as_deref() {
    check_single_url_format(url)?;
  }
  check_url_format(request.reference_image_urls.as_deref())?;
  check_url_format(request.reference_video_urls.as_deref())?;
  check_url_format(request.reference_audio_urls.as_deref())?;

  Ok(())
}
