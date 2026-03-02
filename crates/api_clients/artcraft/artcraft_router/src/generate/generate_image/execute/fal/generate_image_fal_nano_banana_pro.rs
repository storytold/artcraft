use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_pro::{
  FalNbpNumImages, FalNbpResolution, PlanFalNanaBananaPro,
};
use fal_client::requests::webhook::image::edit::enqueue_nano_banana_pro_edit_image_webhook::{
  enqueue_nano_banana_pro_image_edit_webhook, EnqueueNanoBananaProEditImageArgs,
  EnqueueNanoBananaProEditImageNumImages, EnqueueNanoBananaProEditImageResolution,
};
use fal_client::requests::webhook::image::text::enqueue_nano_banana_pro_text_to_image_webhook::{
  enqueue_nano_banana_pro_text_to_image_webhook, EnqueueNanoBananaProTextToImageArgs,
  EnqueueNanoBananaProTextToImageNumImages, EnqueueNanoBananaProTextToImageResolution,
};
pub async fn execute_fal_nano_banana_pro(
  plan: &PlanFalNanaBananaPro<'_>,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let webhook_response = if plan.image_urls.is_empty() {
    // Text-to-image mode
    let args = EnqueueNanoBananaProTextToImageArgs {
      prompt: plan.prompt.unwrap_or(""),
      num_images: to_t2i_num_images(plan.num_images),
      resolution: plan.resolution.map(to_t2i_resolution),
      aspect_ratio: plan.t2i_aspect_ratio,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_nano_banana_pro_text_to_image_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  } else {
    // Image-edit mode
    let args = EnqueueNanoBananaProEditImageArgs {
      prompt: plan.prompt.unwrap_or(""),
      image_urls: plan.image_urls.clone(),
      num_images: to_edit_num_images(plan.num_images),
      resolution: plan.resolution.map(to_edit_resolution),
      aspect_ratio: plan.edit_aspect_ratio,
      webhook_url: fal_client.webhook_url.as_str(),
      api_key: &fal_client.api_key,
    };
    enqueue_nano_banana_pro_image_edit_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
  };

  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2i_num_images(n: FalNbpNumImages) -> EnqueueNanoBananaProTextToImageNumImages {
  match n {
    FalNbpNumImages::One => EnqueueNanoBananaProTextToImageNumImages::One,
    FalNbpNumImages::Two => EnqueueNanoBananaProTextToImageNumImages::Two,
    FalNbpNumImages::Three => EnqueueNanoBananaProTextToImageNumImages::Three,
    FalNbpNumImages::Four => EnqueueNanoBananaProTextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: FalNbpNumImages) -> EnqueueNanoBananaProEditImageNumImages {
  match n {
    FalNbpNumImages::One => EnqueueNanoBananaProEditImageNumImages::One,
    FalNbpNumImages::Two => EnqueueNanoBananaProEditImageNumImages::Two,
    FalNbpNumImages::Three => EnqueueNanoBananaProEditImageNumImages::Three,
    FalNbpNumImages::Four => EnqueueNanoBananaProEditImageNumImages::Four,
  }
}

fn to_t2i_resolution(r: FalNbpResolution) -> EnqueueNanoBananaProTextToImageResolution {
  match r {
    FalNbpResolution::OneK => EnqueueNanoBananaProTextToImageResolution::OneK,
    FalNbpResolution::TwoK => EnqueueNanoBananaProTextToImageResolution::TwoK,
    FalNbpResolution::FourK => EnqueueNanoBananaProTextToImageResolution::FourK,
  }
}

fn to_edit_resolution(r: FalNbpResolution) -> EnqueueNanoBananaProEditImageResolution {
  match r {
    FalNbpResolution::OneK => EnqueueNanoBananaProEditImageResolution::OneK,
    FalNbpResolution::TwoK => EnqueueNanoBananaProEditImageResolution::TwoK,
    FalNbpResolution::FourK => EnqueueNanoBananaProEditImageResolution::FourK,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::image_list_ref::ImageListRef;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::{base_fal_image_request, get_fal_client};
  use test_data::web::image_urls::{GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore] // manually run — fires a real Fal API request
  async fn test_text_to_image_fal_nano_banana_pro() {
    let client = get_fal_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      resolution: Some(CommonResolution::TwoK),
      image_batch_count: Some(1),
      prompt: Some("a cyberpunk city skyline at dusk, neon lights reflecting on rain-soaked streets"),
      ..base_fal_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    println!("Request ID: {:?}", payload.request_id);
    println!("Gateway request ID: {:?}", payload.gateway_request_id);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real Fal API request
  async fn test_text_to_image_fal_nano_banana_pro_batch_four() {
    let client = get_fal_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      resolution: Some(CommonResolution::OneK),
      image_batch_count: Some(4),
      prompt: Some("a golden retriever surfing a wave, cinematic, 4K"),
      ..base_fal_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    println!("Request ID: {:?}", payload.request_id);
    println!("Gateway request ID: {:?}", payload.gateway_request_id);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real Fal API request
  async fn test_edit_image_fal_nano_banana_pro() {
    let client = get_fal_client();

    let image_urls = vec![
      GHOST_IMAGE_URL.to_string(),
      TREX_SKELETON_IMAGE_URL.to_string(),
    ];

    let request = GenerateImageRequest {
      prompt: Some("Add the ghost from the first image hovering above the T-Rex skeleton in the second image, make it look spooky but friendly"),
      image_inputs: Some(ImageListRef::Urls(&image_urls)),
      aspect_ratio: Some(CommonAspectRatio::Auto), // edit mode: preserve source dimensions
      resolution: Some(CommonResolution::TwoK),
      image_batch_count: Some(1),
      ..base_fal_image_request()
    };

    let plan = request.build().unwrap();
    let ImageGenerationPlan::FalNanaBananaPro(ref p) = plan else {
      panic!("expected FalNanaBananaPro plan");
    };
    println!("Plan image_urls: {:?}", p.image_urls);
    println!("Plan edit_aspect_ratio: {:?}", p.edit_aspect_ratio);

    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    println!("Request ID: {:?}", payload.request_id);
    println!("Gateway request ID: {:?}", payload.gateway_request_id);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }
}
