use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_seedream_5_lite::PlanFalSeedream5Lite;
use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v5_lite_edit_image_webhook::{
  enqueue_bytedance_seedream_v5_lite_edit_image_webhook, EnqueueBytedanceSeedreamV5LiteEditImageArgs,
  EnqueueBytedanceSeedreamV5LiteEditImageRequest,
};
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v5_lite_text_to_image_webhook::{
  enqueue_bytedance_seedream_v5_lite_text_to_image_webhook, EnqueueBytedanceSeedreamV5LiteTextToImageArgs,
  EnqueueBytedanceSeedreamV5LiteTextToImageRequest,
};

pub async fn execute_fal_seedream_5_lite(
  plan: &PlanFalSeedream5Lite,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let (webhook_response, outbound_request) = if plan.image_urls.is_empty() {
    let request = EnqueueBytedanceSeedreamV5LiteTextToImageRequest {
      prompt: plan.prompt.clone().unwrap_or_default(),
      num_images: Some(plan.num_images.to_t2i()),
      max_images: None,
      image_size: plan.image_size.map(|s| s.to_t2i()),
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = EnqueueBytedanceSeedreamV5LiteTextToImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_bytedance_seedream_v5_lite_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    (resp, outbound)
  } else {
    let request = EnqueueBytedanceSeedreamV5LiteEditImageRequest {
      prompt: plan.prompt.clone().unwrap_or_default(),
      image_urls: plan.image_urls.clone(),
      num_images: Some(plan.num_images.to_edit()),
      max_images: None,
      image_size: plan.image_size.map(|s| s.to_edit()),
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = EnqueueBytedanceSeedreamV5LiteEditImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_bytedance_seedream_v5_lite_edit_image_webhook(args)
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
