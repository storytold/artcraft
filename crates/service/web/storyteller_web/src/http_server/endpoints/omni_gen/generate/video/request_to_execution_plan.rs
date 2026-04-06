use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Validate that an execution plan can be built for this request.
/// Returns an error if the model/provider combination is unsupported.
pub fn request_to_execution_plan(
  request: &GenerateVideoRequest<'_>,
) -> Result<(), AdvancedCommonWebError> {
  request.build()
    .map(|_| ())
    .map_err(|e| AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Failed to build execution plan: {}", e),
    ))
}
