use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::image::transform_request::transform_request;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;

/// Validate that an execution plan can be built for this request.
/// Returns an error if the model/provider combination is unsupported.
pub fn validate_execution_plan(
  request: &OmniGenImageCostAndGenerateRequest,
) -> Result<(), AdvancedCommonWebError> {
  let generate_request = transform_request(request)?;

  generate_request.build()
    .map(|_| ())
    .map_err(|e| AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Failed to build execution plan: {}", e),
    ))
}
