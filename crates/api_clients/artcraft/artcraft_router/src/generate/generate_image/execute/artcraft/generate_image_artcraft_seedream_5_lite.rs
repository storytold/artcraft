use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  ArtcraftImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_5_lite::PlanArtcraftSeedream5Lite;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_5_lite_multi_function_image_gen::BytedanceSeedream5LiteMultiFunctionImageGenRequest;
use artcraft_client::endpoints::generate::image::multi_function::bytedance_seedream_5_lite_multi_function_image_gen_image::bytedance_seedream_5_lite_multi_function_image_gen;

pub async fn execute_artcraft_seedream_5_lite(
  plan: &PlanArtcraftSeedream5Lite<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let request = BytedanceSeedream5LiteMultiFunctionImageGenRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    image_media_tokens: plan.image_inputs.map(|tokens| tokens.to_owned()),
    num_images: Some(plan.num_images),
    image_size: plan.image_size,
    max_images: None,
  };

  let response = bytedance_seedream_5_lite_multi_function_image_gen(
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
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::{base_seedream_5_lite_image_request, get_artcraft_client};

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_image_seedream_5_lite() {
    let client = get_artcraft_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      image_batch_count: Some(1),
      prompt: Some("a corgi walking through a cyberpunk city at night"),
      ..base_seedream_5_lite_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }
}
