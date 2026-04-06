use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;
use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Build an image generation plan from a transformed request.
pub fn request_to_plan<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, AdvancedCommonWebError> {
  request.build()
    .map_err(|e| {
      warn!("Failed to build image generation plan: {}", e);
      AdvancedCommonWebError::BadInputWithSimpleMessage(
        format!("Failed to build generation plan: {}", e),
      )
    })
}
