use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  ArtcraftImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1::PlanArtcraftGptImage1;
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::GptImage1EditImageRequest;
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::GenerateGptImage1TextToImageRequest;
use artcraft_client::endpoints::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use artcraft_client::endpoints::generate::image::text::generate_gpt_image_1_text_to_image::generate_gpt_image_1_text_to_image;

/// GPT Image 1 has two distinct legacy storyteller-web endpoints (one for
/// text-to-image, one for image-edit), so we dispatch on whether image refs
/// are present rather than calling a single multi-function endpoint.
pub async fn execute_artcraft_gpt_image_1(
  plan: &PlanArtcraftGptImage1<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let inference_job_token = match plan.image_inputs {
    Some(image_inputs) => {
      let request = GptImage1EditImageRequest {
        uuid_idempotency_token: plan.idempotency_token.clone(),
        prompt: plan.prompt.map(|p| p.to_string()),
        image_media_tokens: Some(image_inputs.to_owned()),
        image_size: plan.image_size.map(|s| s.to_edit()),
        num_images: Some(plan.num_images.to_edit()),
        image_quality: Some(plan.quality.to_edit()),
      };
      let response = gpt_image_1_edit_image(
        &artcraft_client.api_host,
        Some(&artcraft_client.credentials),
        request,
      )
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;
      response.inference_job_token
    }
    None => {
      let request = GenerateGptImage1TextToImageRequest {
        uuid_idempotency_token: plan.idempotency_token.clone(),
        prompt: plan.prompt.map(|p| p.to_string()),
        image_size: plan.image_size.map(|s| s.to_t2i()),
        num_images: Some(plan.num_images.to_t2i()),
        image_quality: Some(plan.quality.to_t2i()),
      };
      let response = generate_gpt_image_1_text_to_image(
        &artcraft_client.api_host,
        Some(&artcraft_client.credentials),
        request,
      )
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;
      response.inference_job_token
    }
  };

  Ok(GenerateImageResponse::Artcraft(ArtcraftImageResponsePayload {
    inference_job_token,
  }))
}
