use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  ArtcraftImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_2_lora_angles::PlanArtcraftFlux2LoraAngles;
use artcraft_api_defs::generate::image::angle::flux_2_lora_edit_image_angle::Flux2LoraEditImageAngleRequest;
use artcraft_client::endpoints::generate::image::angle::flux_2_lora_edit_image_angle::flux_2_lora_edit_image_angle;

pub async fn execute_artcraft_flux_2_lora_angles(
  plan: &PlanArtcraftFlux2LoraAngles<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let request = Flux2LoraEditImageAngleRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    image_media_token: plan.image_input.clone(),
    horizontal_angle: plan.horizontal_angle,
    vertical_angle: plan.vertical_angle,
    zoom: plan.zoom,
    num_images: Some(plan.num_images),
    image_size: plan.image_size,
  };

  let response = flux_2_lora_edit_image_angle(
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
  use crate::api::image_list_ref::ImageListRef;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::{base_flux_2_lora_angles_image_request, get_artcraft_client};
  use tokens::tokens::media_files::MediaFileToken;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_angle_edit_flux_2_lora() {
    let client = get_artcraft_client();
    let tokens = vec![MediaFileToken::new_from_str("m_r45apt2swza6wp8j2z10237t92kkr8")];
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::SquareHd),
      image_batch_count: Some(1),
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      horizontal_angle: Some(30.0),
      vertical_angle: Some(0.0),
      zoom: Some(1.0),
      ..base_flux_2_lora_angles_image_request()
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
