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

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::image_list_ref::ImageListRef;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::{base_gpt_image_1_image_request, get_artcraft_client};
  use tokens::tokens::media_files::MediaFileToken;

  // Build-only smoke test that exercises the full text-to-image plan path
  // (no network I/O — we never call generate_image).
  #[test]
  fn build_text_to_image_plan_smoke() {
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      image_batch_count: Some(1),
      ..base_gpt_image_1_image_request()
    };
    let plan = request.build().expect("plan should build");
    assert!(matches!(plan, ImageGenerationPlan::ArtcraftGptImage1(_)));
  }

  // Build-only smoke test for the edit path. We can't actually fire the
  // request without an authenticated client, but we want to make sure the
  // dispatcher recognizes media-token inputs as edit-mode.
  #[test]
  fn build_edit_image_plan_smoke() {
    let tokens = vec![MediaFileToken::new_from_str("mf_test00000000000000000000000000")];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_gpt_image_1_image_request()
    };
    let plan = request.build().expect("plan should build");
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = plan else {
      panic!("expected ArtcraftGptImage1")
    };
    assert!(plan.image_inputs.is_some(), "edit mode must carry image_inputs");
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_image_gpt_image_1() {
    let client = get_artcraft_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      image_batch_count: Some(1),
      prompt: Some("a horse walking through a cyberpunk city at night"),
      ..base_gpt_image_1_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_edit_image_gpt_image_1() {
    let client = get_artcraft_client();

    let image_tokens = vec![
      MediaFileToken::new_from_str("m_r45apt2swza6wp8j2z10237t92kkr8"),
    ];

    let request = GenerateImageRequest {
      prompt: Some("Change the background to a desert with cacti"),
      image_inputs: Some(ImageListRef::MediaFileTokens(&image_tokens)),
      aspect_ratio: Some(CommonAspectRatio::Square),
      image_batch_count: Some(1),
      ..base_gpt_image_1_image_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_image(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_image request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);
  }
}
