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
  EnqueueNanoBanana2EditImageNumImages, EnqueueNanoBanana2EditImageResolution,
};
use fal_client::requests::webhook::image::text::enqueue_nano_banana_2_text_to_image_webhook::{
  enqueue_nano_banana_2_text_to_image_webhook, EnqueueNanoBanana2TextToImageArgs,
  EnqueueNanoBanana2TextToImageNumImages, EnqueueNanoBanana2TextToImageResolution,
};

pub async fn execute_fal_nano_banana_2(
  plan: &PlanFalNanaBanana2<'_>,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let webhook_response = if plan.image_urls.is_empty() {
    // Text-to-image mode
    let args = EnqueueNanoBanana2TextToImageArgs {
      prompt: plan.prompt.unwrap_or(""),
      num_images: to_t2i_num_images(plan.num_images),
      resolution: plan.resolution.map(to_t2i_resolution),
      aspect_ratio: plan.t2i_aspect_ratio,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_nano_banana_2_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  } else {
    // Image-edit mode
    let args = EnqueueNanoBanana2EditImageArgs {
      prompt: plan.prompt.unwrap_or(""),
      image_urls: plan.image_urls.clone(),
      num_images: to_edit_num_images(plan.num_images),
      resolution: plan.resolution.map(to_edit_resolution),
      aspect_ratio: plan.edit_aspect_ratio,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_nano_banana_2_edit_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  };

  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
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
