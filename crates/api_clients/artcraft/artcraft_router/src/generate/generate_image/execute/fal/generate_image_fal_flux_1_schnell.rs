use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_1_schnell::PlanFalFlux1Schnell;
use fal_client::requests::webhook::image::edit::enqueue_flux_1_schnell_edit_image_webhook::{
  enqueue_flux_1_schnell_edit_image_webhook, Flux1SchnellEditImageArgs, Flux1SchnellEditImageRequest,
};
use fal_client::requests::webhook::image::text::enqueue_flux_1_schnell_text_to_image_webhook::{
  enqueue_flux_1_schnell_text_to_image_webhook, Flux1SchnellArgs, Flux1SchnellRequest,
};

pub async fn execute_fal_flux_1_schnell(
  plan: &PlanFalFlux1Schnell,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let (webhook_response, outbound_request) = if let Some(image_url) = &plan.maybe_image_url {
    // Image-to-image (redux) mode
    let request = Flux1SchnellEditImageRequest {
      image_url: image_url.clone(),
      num_images: plan.num_images.to_edit(),
      image_size: plan.edit_image_size,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = Flux1SchnellEditImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_flux_1_schnell_edit_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    (resp, outbound)
  } else {
    // Text-to-image mode
    let request = Flux1SchnellRequest {
      prompt: plan.prompt.clone().unwrap_or_default(),
      aspect_ratio: plan.t2i_aspect_ratio,
      num_images: plan.num_images.to_t2i(),
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = Flux1SchnellArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_flux_1_schnell_text_to_image_webhook(args)
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
