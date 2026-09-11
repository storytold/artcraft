use enums::common::generation::common_image_model::CommonImageModel as CommonImageModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::artcraft::build_common::build_artcraft_omni_image_request;
use crate::generate::generate_image::providers::artcraft::midjourney_7_niji::request::ArtcraftMidjourney7NijiRequestState;

pub fn build_artcraft_midjourney_7_niji(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_image_request(builder, CommonImageModelEnum::Midjourney7Niji)?;
  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::ArtcraftMidjourney7Niji(ArtcraftMidjourney7NijiRequestState { request }),
  ))
}
