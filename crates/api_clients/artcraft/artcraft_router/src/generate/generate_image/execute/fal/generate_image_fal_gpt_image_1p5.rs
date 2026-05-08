use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1p5::PlanFalGptImage1p5;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1p5_edit_image_webhook::{
  enqueue_gpt_image_1p5_image_edit_webhook, EnqueueGptImage1p5EditImageArgs,
  EnqueueGptImage1p5EditImageRequest,
};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_1p5_text_to_image_webhook::{
  enqueue_gpt_image_1p5_text_to_image_webhook, EnqueueGptImage1p5TextToImageArgs,
  EnqueueGptImage1p5TextToImageRequest,
};

pub async fn execute_fal_gpt_image_1p5(
  plan: &PlanFalGptImage1p5,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let (webhook_response, outbound_request) = if plan.image_urls.is_empty() {
    let request = EnqueueGptImage1p5TextToImageRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      num_images: plan.num_images.to_t2i(),
      image_size: plan.image_size.map(|s| s.to_t2i()),
      background: None,
      quality: Some(plan.quality.to_t2i()),
      output_format: None,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = EnqueueGptImage1p5TextToImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_gpt_image_1p5_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    (resp, outbound)
  } else {
    let request = EnqueueGptImage1p5EditImageRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      image_urls: plan.image_urls.clone(),
      num_images: plan.num_images.to_edit(),
      mask_image_url: None,
      image_size: plan.image_size.map(|s| s.to_edit()),
      background: None,
      quality: Some(plan.quality.to_edit()),
      input_fidelity: None,
      output_format: None,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = EnqueueGptImage1p5EditImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_gpt_image_1p5_image_edit_webhook(args)
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
