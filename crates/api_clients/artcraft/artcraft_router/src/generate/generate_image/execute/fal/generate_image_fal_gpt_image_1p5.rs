use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1p5::PlanFalGptImage1p5;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1p5_edit_image_webhook::{
  enqueue_gpt_image_1p5_image_edit_webhook, EnqueueGptImage1p5EditImageArgs,
};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_1p5_text_to_image_webhook::{
  enqueue_gpt_image_1p5_text_to_image_webhook, EnqueueGptImage1p5TextToImageArgs,
};

pub async fn execute_fal_gpt_image_1p5(
  plan: &PlanFalGptImage1p5<'_>,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let webhook_response = if plan.image_urls.is_empty() {
    let args = EnqueueGptImage1p5TextToImageArgs {
      prompt: plan.prompt.unwrap_or(""),
      num_images: plan.num_images.to_t2i(),
      image_size: plan.image_size.map(|s| s.to_t2i()),
      background: None,
      quality: Some(plan.quality.to_t2i()),
      output_format: None,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_gpt_image_1p5_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  } else {
    let args = EnqueueGptImage1p5EditImageArgs {
      prompt: plan.prompt.unwrap_or(""),
      image_urls: plan.image_urls.clone(),
      num_images: plan.num_images.to_edit(),
      mask_image_url: None,
      image_size: plan.image_size.map(|s| s.to_edit()),
      background: None,
      quality: Some(plan.quality.to_edit()),
      input_fidelity: None,
      output_format: None,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_gpt_image_1p5_image_edit_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  };

  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}
