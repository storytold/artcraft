use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::shared_utils::video::validate_when_image_required::validate_when_image_required;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

/// Validate requests before they incur user costs or send API requests
pub fn validate_video_request(
  request: &OmniGenVideoCostAndGenerateRequest,
) -> Result<(), CommonWebError> {
  validate_when_image_required(request)?;
  Ok(())
}
