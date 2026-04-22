use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_2::PlanFalGptImage2;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_2_edit_image_webhook::{
  enqueue_gpt_image_2_edit_image_webhook, EnqueueGptImage2EditImageArgs,
};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_2_text_to_image_webhook::{
  enqueue_gpt_image_2_text_to_image_webhook, EnqueueGptImage2TextToImageArgs,
};

pub async fn execute_fal_gpt_image_2(
  plan: &PlanFalGptImage2,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let webhook_response = if plan.image_urls.is_empty() {
    let args = EnqueueGptImage2TextToImageArgs {
      prompt: plan.prompt.as_deref().unwrap_or(""),
      num_images: plan.num_images.to_t2i(),
      image_size: plan.image_size.map(|s| s.to_t2i()),
      quality: Some(plan.quality.to_t2i()),
      output_format: None,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_gpt_image_2_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  } else {
    let args = EnqueueGptImage2EditImageArgs {
      prompt: plan.prompt.as_deref().unwrap_or(""),
      image_urls: plan.image_urls.clone(),
      num_images: plan.num_images.to_edit(),
      mask_url: None,
      image_size: plan.image_size.map(|s| s.to_edit()),
      quality: Some(plan.quality.to_edit()),
      output_format: None,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_gpt_image_2_edit_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  };

  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

#[cfg(test)]
mod tests {
  use test_data::web::image_urls::{GHOST_IMAGE_URL, JUNO_AT_LAKE_IMAGE_URL, TREX_SKELETON_IMAGE_URL};
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::get_fal_client;

  // ── Build smoke tests ──

  mod build_smoke_tests {
    use super::*;

    #[test]
    fn text_to_image_plan() {
      let request = GenerateImageRequest {
        aspect_ratio: Some(CommonAspectRatio::Square),
        image_batch_count: Some(1),
        ..base_request()
      };
      let plan = request.build().expect("plan should build");
      let ImageGenerationPlan::FalGptImage2(plan) = plan else {
        panic!("expected FalGptImage2")
      };
      assert!(plan.image_urls.is_empty(), "text mode must have no image_urls");
    }

    #[test]
    fn edit_image_plan() {
      let urls = vec![
        JUNO_AT_LAKE_IMAGE_URL.to_string(),
        GHOST_IMAGE_URL.to_string(),
      ];
      let request = GenerateImageRequest {
        prompt: Some("dog running from a scary ghost".to_string()),
        image_inputs: Some(ImageListRef::Urls(urls.clone())),
        ..base_request()
      };
      let plan = request.build().expect("plan should build");
      let ImageGenerationPlan::FalGptImage2(plan) = plan else {
        panic!("expected FalGptImage2")
      };
      assert_eq!(plan.image_urls, urls);
    }
  }

  // ── Live API tests ──

  mod live_api_tests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually run — fires a real fal API request and incurs cost
    async fn text_to_image() {
      let client = get_fal_client();
      let request = GenerateImageRequest {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        image_batch_count: Some(1),
        prompt: Some("a horse walking through a cyberpunk city at night".to_string()),
        ..base_request()
      };

      let plan = request.build().unwrap();
      let result = plan.generate_image(&client).await;
      println!("Result: {:?}", result);
      let response = result.expect("generate_image request failed");
      let payload = response.get_fal_payload().expect("expected Fal payload");
      println!("Request id: {:?}", payload.request_id);
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real fal API request and incurs cost
    async fn edit_image() {
      let client = get_fal_client();
      let request = GenerateImageRequest {
        prompt: Some("dog running from a scary ghost".to_string()),
        image_inputs: Some(ImageListRef::Urls(vec![
          JUNO_AT_LAKE_IMAGE_URL.to_string(),
          GHOST_IMAGE_URL.to_string(),
        ])),
        aspect_ratio: Some(CommonAspectRatio::Square),
        image_batch_count: Some(1),
        ..base_request()
      };

      let plan = request.build().unwrap();
      let result = plan.generate_image(&client).await;
      println!("Result: {:?}", result);
      let response = result.expect("generate_image request failed");
      let payload = response.get_fal_payload().expect("expected Fal payload");
      println!("Request id: {:?}", payload.request_id);
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  // ── Helpers ──

  fn base_request() -> GenerateImageRequest {
    GenerateImageRequest {
      model: CommonImageModel::GptImage2,
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
}
