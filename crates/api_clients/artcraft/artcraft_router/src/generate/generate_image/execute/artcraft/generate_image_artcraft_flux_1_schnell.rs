use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  ArtcraftImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_1_schnell::PlanArtcraftFlux1Schnell;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageRequest;
use artcraft_client::endpoints::generate::image::text::generate_flux_1_schnell_text_to_image::generate_flux_1_schnell_text_to_image;

pub async fn execute_artcraft_flux_1_schnell(
  plan: &PlanArtcraftFlux1Schnell<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let request = GenerateFlux1SchnellTextToImageRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    aspect_ratio: plan.aspect_ratio,
    num_images: Some(plan.num_images),
  };

  let response = generate_flux_1_schnell_text_to_image(
    &artcraft_client.api_host,
    Some(&artcraft_client.credentials),
    request,
  )
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  Ok(GenerateImageResponse::Artcraft(ArtcraftImageResponsePayload {
    inference_job_token: response.inference_job_token,
  }))
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::{base_flux_1_schnell_image_request, get_artcraft_client};
  use strum::IntoEnumIterator;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_image_flux_1_schnell() {
    let client = get_artcraft_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      image_batch_count: Some(1),
      prompt: Some("a man and woman walking through a cyberpunk city at night"),
      ..base_flux_1_schnell_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_image_flux_1_schnell_batch_four() {
    let client = get_artcraft_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      image_batch_count: Some(4),
      prompt: Some("a dog surfing a wave, cinematic"),
      ..base_flux_1_schnell_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }

  #[tokio::test]
  #[ignore] // manually run — fires one real API request per aspect ratio variant (expensive)
  async fn test_text_to_image_flux_1_schnell_all_aspect_ratios() {
    let client = get_artcraft_client();

    for ar in CommonAspectRatio::iter() {
      println!("--- text-to-image aspect ratio: {:?} ---", ar);
      let request = GenerateImageRequest {
        aspect_ratio: Some(ar),
        image_batch_count: Some(1),
        prompt: Some("a man and woman walking through a futuristic city at evening"),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_flux_1_schnell_image_request()
      };
      match request.build() {
        Err(e) => println!("  plan error: {:?}", e),
        Ok(plan) => match plan.generate_image(&client).await {
          Ok(response) => {
            let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
            println!("  job token: {:?}", payload.inference_job_token);
          }
          Err(e) => println!("  generate error: {:?}", e),
        },
      }
    }

    assert_eq!(1, 2); // NB: Intentional failure to inspect the responses above.
  }
}
