use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_seedream_4::PlanFalSeedream4;
use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4_edit_image_webhook::{
  enqueue_bytedance_seedream_v4_edit_image_webhook, EnqueueBytedanceSeedreamV4EditImageArgs,
};
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4_text_to_image_webhook::{
  enqueue_bytedance_seedream_v4_text_to_image_webhook, EnqueueBytedanceSeedreamV4TextToImageArgs,
};

pub async fn execute_fal_seedream_4(
  plan: &PlanFalSeedream4<'_>,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let webhook_response = if plan.image_urls.is_empty() {
    let args = EnqueueBytedanceSeedreamV4TextToImageArgs {
      prompt: plan.prompt.unwrap_or(""),
      num_images: Some(plan.num_images.to_t2i()),
      max_images: None,
      image_size: plan.image_size.map(|s| s.to_t2i()),
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_bytedance_seedream_v4_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  } else {
    let args = EnqueueBytedanceSeedreamV4EditImageArgs {
      prompt: plan.prompt.unwrap_or(""),
      image_urls: plan.image_urls.clone(),
      num_images: Some(plan.num_images.to_edit()),
      max_images: None,
      image_size: plan.image_size.map(|s| s.to_edit()),
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_bytedance_seedream_v4_edit_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  };

  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}
