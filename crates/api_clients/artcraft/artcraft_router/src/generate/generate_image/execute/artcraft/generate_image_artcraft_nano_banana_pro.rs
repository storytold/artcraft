use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::image_generation_plan::GenerateImageResponse;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_pro::PlanArtcraftNanaBananaPro;
use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::NanoBananaProMultiFunctionImageGenRequest;
use artcraft_client::endpoints::generate::image::multi_function::nano_banana_pro_multi_function_image_gen_image::nano_banana_pro_multi_function_image_gen;

pub async fn execute_artcraft_nano_banana_pro(
  plan: &PlanArtcraftNanaBananaPro<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let request = NanoBananaProMultiFunctionImageGenRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    image_media_tokens: plan.image_inputs.map(|tokens| tokens.to_owned()),
    num_images: Some(plan.num_images),
    resolution: plan.resolution,
    aspect_ratio: plan.aspect_ratio,
  };

  let response = nano_banana_pro_multi_function_image_gen(
    &artcraft_client.api_host,
    Some(&artcraft_client.credentials),
    request,
  )
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  Ok(GenerateImageResponse {
    inference_job_token: response.inference_job_token,
  })
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::image_list_ref::ImageListRef;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::{base_image_request, get_artcraft_client};
  use tokens::tokens::media_files::MediaFileToken;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_image_nano_banana_pro() {
    let client = get_artcraft_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      resolution: Some(CommonResolution::OneK),
      image_batch_count: Some(1),
      prompt: Some("a cat walking through a cyberpunk city at night"),
      ..base_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    println!("Job token: {:?}", response.inference_job_token);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_image_nano_banana_pro_batch_four() {
    let client = get_artcraft_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      resolution: Some(CommonResolution::OneK),
      image_batch_count: Some(4),
      prompt: Some("a dog surfing a wave, cinematic"),
      ..base_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    println!("Job token: {:?}", response.inference_job_token);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_edit_image_nano_banana_pro() {
    let client = get_artcraft_client();

    // Reference images: the man to transplant, then the destination scene.
    let image_tokens = vec![
      MediaFileToken::new_from_str("m_r45apt2swza6wp8j2z10237t92kkr8"),
      MediaFileToken::new_from_str("m_2220d5we3masng5hvzg5zz68ywbdqd"),
    ];

    let request = GenerateImageRequest {
      prompt: Some("Add the man in the first image into the fantasy scene in the second image. Keep his hoodie and attire, but match the vibe of the fantasy scene."),
      image_inputs: Some(ImageListRef::MediaFileTokens(&image_tokens)),
      aspect_ratio: Some(CommonAspectRatio::Auto), // edit mode: preserve source dimensions
      resolution: Some(CommonResolution::OneK),
      image_batch_count: Some(1),
      ..base_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    println!("Job token: {:?}", response.inference_job_token);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }
}
