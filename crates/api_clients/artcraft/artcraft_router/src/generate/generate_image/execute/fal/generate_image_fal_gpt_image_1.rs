use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1::PlanFalGptImage1;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1_edit_image_webhook::{
  enqueue_gpt_image_1_edit_image_webhook, EnqueueGptImage1EditImageArgs,
  EnqueueGptImage1EditImageRequest,
};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_1_text_to_image_webhook::{
  enqueue_gpt_image_1_text_to_image_webhook, EnqueueGptImage1TextToImageArgs,
  EnqueueGptImage1TextToImageRequest,
};

pub async fn execute_fal_gpt_image_1(
  plan: &PlanFalGptImage1,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let (webhook_response, outbound_request) = if plan.image_urls.is_empty() {
    let request = EnqueueGptImage1TextToImageRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      num_images: plan.num_images.to_t2i(),
      image_size: plan.image_size.map(|s| s.to_t2i()),
      quality: Some(plan.quality.to_t2i()),
      background: None,
      output_format: None,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = EnqueueGptImage1TextToImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_gpt_image_1_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    (resp, outbound)
  } else {
    let request = EnqueueGptImage1EditImageRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      image_urls: plan.image_urls.clone(),
      num_images: plan.num_images.to_edit(),
      mask_image_url: None,
      image_size: plan.image_size.map(|s| s.to_edit()),
      quality: Some(plan.quality.to_edit()),
      input_fidelity: None,
      background: None,
      output_format: None,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = EnqueueGptImage1EditImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_gpt_image_1_edit_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    (resp, outbound)
  };

  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
    maybe_outbound_request: Some(outbound_request),
  }))
}

#[cfg(test)]
mod tests {
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::get_fal_client;

  fn base_fal_request() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: CommonImageModel::GptImage1,
      provider: Provider::Fal,
      prompt: Some("a cat in space".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    }
  }

  // Build-only smoke test (no network I/O).
  #[test]
  fn build_text_to_image_plan_smoke() {
    let request = GenerateImageRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::Square),
      image_batch_count: Some(1),
      ..base_fal_request()
    };
    let plan = request.build().expect("plan should build");
    let ImageGenerationPlan::FalGptImage1(plan) = plan else {
      panic!("expected FalGptImage1")
    };
    assert!(plan.image_urls.is_empty(), "text mode must have no image_urls");
  }

  // Build-only smoke test for edit mode.
  #[test]
  fn build_edit_image_plan_smoke() {
    let urls = vec!["https://example.com/img.jpg".to_string()];
    let request = GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(urls.clone())),
      ..base_fal_request()
    };
    let plan = request.build().expect("plan should build");
    let ImageGenerationPlan::FalGptImage1(plan) = plan else {
      panic!("expected FalGptImage1")
    };
    assert_eq!(plan.image_urls, urls);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real fal API request and incurs cost
  async fn test_text_to_image_gpt_image_1_fal() {
    let client = get_fal_client();
    let request = GenerateImageRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      image_batch_count: Some(1),
      prompt: Some("a horse walking through a cyberpunk city at night".to_string()),
      ..base_fal_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;
    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    println!("Request id: {:?}", payload.request_id);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real fal API request and incurs cost
  async fn test_edit_image_gpt_image_1_fal() {
    let client = get_fal_client();
    let urls = vec![
      TREX_SKELETON_IMAGE_URL.to_string(),
    ];
    let request = GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(urls.clone())),
      aspect_ratio: Some(CommonAspectRatio::Square),
      image_batch_count: Some(1),
      prompt: Some("change the background to a desert".to_string()),
      ..base_fal_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;
    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    println!("Request id: {:?}", payload.request_id);
  }
}
