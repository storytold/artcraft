use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  ArtcraftImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_2::PlanArtcraftGptImage2;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use enums::common::generation::common_image_model::CommonImageModel;

/// Execute GPT Image 2 via the Artcraft omni-gen image endpoint.
pub async fn execute_artcraft_gpt_image_2(
  plan: &PlanArtcraftGptImage2,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let request = OmniGenImageCostAndGenerateRequest {
    idempotency_token: Some(plan.idempotency_token.clone()),
    model: Some(CommonImageModel::GptImage2),
    prompt: plan.prompt.clone(),
    image_media_tokens: plan.image_inputs.clone(),
    resolution: None,
    aspect_ratio: plan.aspect_ratio_enum(),
    quality: Some(plan.quality_enum()),
    image_batch_count: Some(plan.num_images_u16()),
    adjust_horizontal_angle: None,
    adjust_vertical_angle: None,
    adjust_zoom: None,
  };

  let response = omni_gen_image_generate(
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
  use artcraft_client::utils::api_host::ApiHost;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_quality::CommonQuality;
  use crate::api::image_list_ref::ImageListRef;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::{get_artcraft_client, get_artcraft_client_for_env};
  use tokens::tokens::media_files::MediaFileToken;

  fn base_gpt_image_2_request() -> GenerateImageRequest {
    GenerateImageRequest {
      model: crate::api::common_image_model::CommonImageModel::GptImage2,
      provider: crate::api::provider::Provider::Artcraft,
      prompt: Some("a t-rex walking through a cyberpunk city at night".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    }
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_image_gpt_image_2() {
    let client = get_artcraft_client_for_env(ApiHost::Localhost { port: 12345 });
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      image_batch_count: Some(1),
      ..base_gpt_image_2_request()
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
  async fn test_edit_image_gpt_image_2() {
    let client = get_artcraft_client();

    let image_tokens = vec![
      MediaFileToken::new_from_str("m_r45apt2swza6wp8j2z10237t92kkr8"),
    ];

    let request = GenerateImageRequest {
      prompt: Some("Change the background to a desert with cacti".to_string()),
      image_inputs: Some(ImageListRef::MediaFileTokens(image_tokens)),
      aspect_ratio: Some(CommonAspectRatio::Auto),
      image_batch_count: Some(1),
      ..base_gpt_image_2_request()
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
  async fn test_text_to_image_gpt_image_2_high_quality() {
    let client = get_artcraft_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      quality: Some(CommonQuality::High),
      image_batch_count: Some(1),
      ..base_gpt_image_2_request()
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
