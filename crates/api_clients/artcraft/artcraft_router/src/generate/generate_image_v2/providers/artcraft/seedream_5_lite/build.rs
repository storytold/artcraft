use enums::common::generation::common_image_model::CommonImageModel as CommonImageModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::artcraft::build_common::build_artcraft_omni_image_request;
use crate::generate::generate_image_v2::providers::artcraft::seedream_5_lite::request::ArtcraftSeedream5LiteRequestState;

pub fn build_artcraft_seedream_5_lite(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_image_request(builder, CommonImageModelEnum::Seedream5Lite)?;
  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::ArtcraftSeedream5Lite(ArtcraftSeedream5LiteRequestState { request }),
  ))
}
