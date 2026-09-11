use fal_client::requests::api::image::edit::gpt_image_2p5_flare_edit_image::api::GptImage2p5FlareEditImageRequest;
use fal_client::requests::api::image::text::gpt_image_2p5_flare_text_to_image::api::GptImage2p5FlareTextToImageRequest;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::fal::gpt_image_2p5_common::plan::{plan_gpt_image_2p5_params, PlannedGptImage2p5Params};
use crate::generate::generate_image::providers::fal::gpt_image_2p5_flare::request::FalGptImage2p5FlareRequestState;

/// Text-to-image and edit share one model entry; the mode is chosen by whether the builder
/// carries reference images. Planning is shared with the other GPT Image 2.5 variant.
pub fn build_fal_gpt_image_2p5_flare(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = match plan_gpt_image_2p5_params(&builder)? {
    PlannedGptImage2p5Params::TextToImage(params) => {
      FalGptImage2p5FlareRequestState::TextToImage(GptImage2p5FlareTextToImageRequest { params })
    }
    PlannedGptImage2p5Params::EditImage(params) => {
      FalGptImage2p5FlareRequestState::EditImage(GptImage2p5FlareEditImageRequest { params })
    }
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalGptImage2p5Flare(state),
  ))
}

#[cfg(test)]
mod tests {
  use super::*;
  use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_quality::RouterQuality;
  use crate::api::router_resolution::RouterResolution;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;

  #[test]
  fn build2_routes_to_flare_text_to_image() {
    let request = unwrap_t2i(base_builder().build2());
    assert_eq!(request.params.prompt, "a cat in space");
    assert_eq!(GptImage2p5FlareTextToImageRequest::ENDPOINT, "openai/gpt-image-2.5/flare/text-to-image");
  }

  #[test]
  fn build2_routes_to_flare_edit_when_reference_images_present() {
    let request = unwrap_edit(GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
      ..base_builder()
    }.build2());
    assert_eq!(request.params.image_urls, vec!["https://example.com/img.jpg"]);
    assert_eq!(GptImage2p5FlareEditImageRequest::ENDPOINT, "openai/gpt-image-2.5/flare/edit");
  }

  #[test]
  fn planned_fields_reach_the_fal_request() {
    let request = unwrap_t2i(GenerateImageRequestBuilder {
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      resolution: Some(RouterResolution::TwoK),
      quality: Some(RouterQuality::Medium),
      image_batch_count: Some(3),
      ..base_builder()
    }.build2());
    assert_eq!(format!("{:?}", request.params.image_size), "Some(Landscape16x9)");
    assert_eq!(format!("{:?}", request.params.resolution), "Some(TwoK)");
    assert_eq!(format!("{:?}", request.params.quality), "Some(Medium)");
    assert_eq!(format!("{:?}", request.params.num_images), "Three");
  }

  #[test]
  fn raw_wire_request_matches_fal_schema() {
    let request = unwrap_t2i(GenerateImageRequestBuilder {
      aspect_ratio: Some(RouterAspectRatio::Square),
      quality: Some(RouterQuality::High),
      image_batch_count: Some(2),
      ..base_builder()
    }.build2());
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({
      "prompt": "a cat in space",
      "image_size": "square",
      "quality": "high",
      "num_images": 2,
      "output_format": "png",
    }));
  }

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::GptImage2p5Flare,
      provider: RouterProvider::Fal,
      prompt: Some("a cat in space".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  fn unwrap_t2i(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> GptImage2p5FlareTextToImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalGptImage2p5Flare(FalGptImage2p5FlareRequestState::TextToImage(request))
    ) = result.expect("build should succeed") else {
      panic!("expected GPT Image 2.5 Flare text-to-image request")
    };
    request
  }

  fn unwrap_edit(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> GptImage2p5FlareEditImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalGptImage2p5Flare(FalGptImage2p5FlareRequestState::EditImage(request))
    ) = result.expect("build should succeed") else {
      panic!("expected GPT Image 2.5 Flare edit-image request")
    };
    request
  }
}
