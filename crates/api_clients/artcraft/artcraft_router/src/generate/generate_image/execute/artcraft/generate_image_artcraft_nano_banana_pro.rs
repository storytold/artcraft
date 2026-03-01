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
