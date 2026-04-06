use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Build a video generation plan from a transformed request.
pub fn request_to_plan<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, AdvancedCommonWebError> {
  request.build()
    .map_err(|e| {
      warn!("Failed to build video generation plan: {}", e);
      AdvancedCommonWebError::BadInputWithSimpleMessage(
        format!("Failed to build generation plan: {}", e),
      )
    })
}
