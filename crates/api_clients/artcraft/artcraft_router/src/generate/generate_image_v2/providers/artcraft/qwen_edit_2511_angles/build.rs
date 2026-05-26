use enums::common::generation::common_image_model::CommonImageModel as CommonImageModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::artcraft::angle_validation::require_at_least_one_image_input;
use crate::generate::generate_image_v2::providers::artcraft::build_common::build_artcraft_omni_image_request;
use crate::generate::generate_image_v2::providers::artcraft::qwen_edit_2511_angles::request::ArtcraftQwenEdit2511AnglesRequestState;

pub fn build_artcraft_qwen_edit_2511_angles(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  require_at_least_one_image_input(&builder.image_inputs)?;
  let request = build_artcraft_omni_image_request(builder, CommonImageModelEnum::QwenEdit2511Angles)?;
  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::ArtcraftQwenEdit2511Angles(ArtcraftQwenEdit2511AnglesRequestState { request }),
  ))
}
