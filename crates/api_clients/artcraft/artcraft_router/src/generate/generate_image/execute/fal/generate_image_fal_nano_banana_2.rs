use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_2::{
  FalNb2NumImages, FalNb2Resolution, PlanFalNanaBanana2,
};
use fal_client::requests::webhook::image::edit::enqueue_nano_banana_2_edit_image_webhook::{
  enqueue_nano_banana_2_edit_image_webhook, EnqueueNanoBanana2EditImageArgs,
  EnqueueNanoBanana2EditImageNumImages, EnqueueNanoBanana2EditImageRequest,
  EnqueueNanoBanana2EditImageResolution,
};
use fal_client::requests::webhook::image::text::enqueue_nano_banana_2_text_to_image_webhook::{
  enqueue_nano_banana_2_text_to_image_webhook, EnqueueNanoBanana2TextToImageArgs,
  EnqueueNanoBanana2TextToImageNumImages, EnqueueNanoBanana2TextToImageRequest,
  EnqueueNanoBanana2TextToImageResolution,
};

pub async fn execute_fal_nano_banana_2(
  plan: &PlanFalNanaBanana2,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let (webhook_response, outbound_request) = if plan.image_urls.is_empty() {
    // Text-to-image mode
    let request = EnqueueNanoBanana2TextToImageRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      num_images: to_t2i_num_images(plan.num_images),
      resolution: plan.resolution.map(to_t2i_resolution),
      aspect_ratio: plan.t2i_aspect_ratio,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = EnqueueNanoBanana2TextToImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_nano_banana_2_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    (resp, outbound)
  } else {
    // Image-edit mode
    let request = EnqueueNanoBanana2EditImageRequest {
      prompt: plan.prompt.as_deref().unwrap_or("").to_string(),
      image_urls: plan.image_urls.clone(),
      num_images: to_edit_num_images(plan.num_images),
      resolution: plan.resolution.map(to_edit_resolution),
      aspect_ratio: plan.edit_aspect_ratio,
    };
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
    let args = EnqueueNanoBanana2EditImageArgs {
      request,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    let resp = enqueue_nano_banana_2_edit_image_webhook(args)
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

fn to_t2i_num_images(n: FalNb2NumImages) -> EnqueueNanoBanana2TextToImageNumImages {
  match n {
    FalNb2NumImages::One => EnqueueNanoBanana2TextToImageNumImages::One,
    FalNb2NumImages::Two => EnqueueNanoBanana2TextToImageNumImages::Two,
    FalNb2NumImages::Three => EnqueueNanoBanana2TextToImageNumImages::Three,
    FalNb2NumImages::Four => EnqueueNanoBanana2TextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: FalNb2NumImages) -> EnqueueNanoBanana2EditImageNumImages {
  match n {
    FalNb2NumImages::One => EnqueueNanoBanana2EditImageNumImages::One,
    FalNb2NumImages::Two => EnqueueNanoBanana2EditImageNumImages::Two,
    FalNb2NumImages::Three => EnqueueNanoBanana2EditImageNumImages::Three,
    FalNb2NumImages::Four => EnqueueNanoBanana2EditImageNumImages::Four,
  }
}

fn to_t2i_resolution(r: FalNb2Resolution) -> EnqueueNanoBanana2TextToImageResolution {
  match r {
    FalNb2Resolution::HalfK => EnqueueNanoBanana2TextToImageResolution::HalfK,
    FalNb2Resolution::OneK => EnqueueNanoBanana2TextToImageResolution::OneK,
    FalNb2Resolution::TwoK => EnqueueNanoBanana2TextToImageResolution::TwoK,
    FalNb2Resolution::FourK => EnqueueNanoBanana2TextToImageResolution::FourK,
  }
}

fn to_edit_resolution(r: FalNb2Resolution) -> EnqueueNanoBanana2EditImageResolution {
  match r {
    FalNb2Resolution::HalfK => EnqueueNanoBanana2EditImageResolution::HalfK,
    FalNb2Resolution::OneK => EnqueueNanoBanana2EditImageResolution::OneK,
    FalNb2Resolution::TwoK => EnqueueNanoBanana2EditImageResolution::TwoK,
    FalNb2Resolution::FourK => EnqueueNanoBanana2EditImageResolution::FourK,
  }
}
