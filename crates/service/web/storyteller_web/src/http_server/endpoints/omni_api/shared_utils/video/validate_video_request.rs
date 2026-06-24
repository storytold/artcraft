use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_api::shared_utils::video::validate_when_image_required::validate_when_image_required;
use artcraft_api_defs::omni_api::generate_requests::omni_api_video_generate_request::OmniApiVideoGenerateRequest;

/// Validate requests before they incur user costs or send API requests
pub fn validate_video_request(
  request: &OmniApiVideoGenerateRequest,
) -> Result<(), CommonWebError> {
  validate_when_image_required(request)?;
  Ok(())
}
