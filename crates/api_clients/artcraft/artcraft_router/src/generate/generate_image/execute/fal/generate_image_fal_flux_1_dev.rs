use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_1_dev::PlanFalFlux1Dev;
use fal_client::requests::webhook::image::edit::enqueue_flux_1_dev_edit_image_webhook::{
  enqueue_flux_1_dev_edit_image_webhook, Flux1DevEditImageArgs, Flux1DevEditImageRequest,
};
use fal_client::requests::webhook::image::text::enqueue_flux_1_dev_text_to_image_webhook::{
  enqueue_flux_1_dev_text_to_image_webhook, Flux1DevArgs, Flux1DevRequest,
};

pub async fn execute_fal_flux_1_dev(
  plan: &PlanFalFlux1Dev,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let (webhook_response, outbound_request) = if let Some(image_url) = &plan.maybe_image_url {
    // Image-to-image mode
    let request = Flux1DevEditImageRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      image_url: image_url.clone(),
      num_images: plan.num_images.to_edit(),
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = Flux1DevEditImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_flux_1_dev_edit_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    (resp, outbound)
  } else {
    // Text-to-image mode
    let request = Flux1DevRequest {
      prompt: plan.prompt.clone().unwrap_or_default(),
      aspect_ratio: plan.aspect_ratio,
      num_images: plan.num_images.to_t2i(),
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = Flux1DevArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_flux_1_dev_text_to_image_webhook(args)
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
