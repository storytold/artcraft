use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana::{
  FalNbNumImages, PlanFalNanoBanana,
};
use fal_client::requests::webhook::image::edit::enqueue_gemini_25_flash_edit_webhook::{
  enqueue_gemini_25_flash_edit_webhook, Gemini25FlashEditArgs,
  Gemini25FlashEditNumImages, Gemini25FlashEditRequest,
};
use fal_client::requests::webhook::image::text::enqueue_gemini_25_flash_text_to_image_webhook::{
  enqueue_gemini_25_flash_text_to_image_webhook, Gemini25FlashTextToImageArgs,
  Gemini25FlashTextToImageNumImages, Gemini25FlashTextToImageRequest,
};

pub async fn execute_fal_nano_banana(
  plan: &PlanFalNanoBanana,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let (webhook_response, outbound_request) = if plan.image_urls.is_empty() {
    // Text-to-image mode
    let request = Gemini25FlashTextToImageRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      num_images: to_t2i_num_images(plan.num_images),
      aspect_ratio: plan.t2i_aspect_ratio,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = Gemini25FlashTextToImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_gemini_25_flash_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    (resp, outbound)
  } else {
    // Image-edit mode
    let request = Gemini25FlashEditRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      image_urls: plan.image_urls.clone(),
      num_images: to_edit_num_images(plan.num_images),
      aspect_ratio: plan.edit_aspect_ratio,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = Gemini25FlashEditArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_gemini_25_flash_edit_webhook(args)
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

fn to_t2i_num_images(n: FalNbNumImages) -> Gemini25FlashTextToImageNumImages {
  match n {
    FalNbNumImages::One => Gemini25FlashTextToImageNumImages::One,
    FalNbNumImages::Two => Gemini25FlashTextToImageNumImages::Two,
    FalNbNumImages::Three => Gemini25FlashTextToImageNumImages::Three,
    FalNbNumImages::Four => Gemini25FlashTextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: FalNbNumImages) -> Gemini25FlashEditNumImages {
  match n {
    FalNbNumImages::One => Gemini25FlashEditNumImages::One,
    FalNbNumImages::Two => Gemini25FlashEditNumImages::Two,
    FalNbNumImages::Three => Gemini25FlashEditNumImages::Three,
    FalNbNumImages::Four => Gemini25FlashEditNumImages::Four,
  }
}
