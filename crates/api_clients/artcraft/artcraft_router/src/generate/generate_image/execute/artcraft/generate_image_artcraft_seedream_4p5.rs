use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  ArtcraftImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_4p5::PlanArtcraftSeedream4p5;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen::BytedanceSeedreamV4p5MultiFunctionImageGenRequest;
use artcraft_client::endpoints::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen_image::bytedance_seedream_v4p5_multi_function_image_gen;

pub async fn execute_artcraft_seedream_4p5(
  plan: &PlanArtcraftSeedream4p5<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let request = BytedanceSeedreamV4p5MultiFunctionImageGenRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    image_media_tokens: plan.image_inputs.map(|tokens| tokens.to_owned()),
    num_images: Some(plan.num_images),
    image_size: plan.image_size,
    max_images: None,
  };

  let response = bytedance_seedream_v4p5_multi_function_image_gen(
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
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::{base_seedream_4p5_image_request, get_artcraft_client};
  use strum::IntoEnumIterator;
  use tokens::tokens::media_files::MediaFileToken;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_image_seedream_4p5() {
    let client = get_artcraft_client();
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      image_batch_count: Some(1),
      prompt: Some("a corgi walking through a cyberpunk city at night"),
      ..base_seedream_4p5_image_request()
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
  async fn test_edit_image_seedream_4p5() {
    let client = get_artcraft_client();

    let image_tokens = vec![
      MediaFileToken::new_from_str("m_r45apt2swza6wp8j2z10237t92kkr8"),
    ];

    let request = GenerateImageRequest {
      prompt: Some("Change the background to a spooky haunted house"),
      image_inputs: Some(ImageListRef::MediaFileTokens(&image_tokens)),
      aspect_ratio: Some(CommonAspectRatio::Auto2k),
      image_batch_count: Some(1),
      ..base_seedream_4p5_image_request()
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
  async fn test_text_to_image_seedream_4p5_all_aspect_ratios() {
    let client = get_artcraft_client();

    for ar in CommonAspectRatio::iter() {
      println!("--- text-to-image aspect ratio: {:?} ---", ar);
      let request = GenerateImageRequest {
        aspect_ratio: Some(ar),
        image_batch_count: Some(1),
        prompt: Some("a corgi walking through a cyberpunk city at night"),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_seedream_4p5_image_request()
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

  #[tokio::test]
  #[ignore] // manually run — fires one real API request per aspect ratio variant (expensive)
  async fn test_edit_image_seedream_4p5_all_aspect_ratios() {
    let client = get_artcraft_client();

    let image_tokens = vec![
      MediaFileToken::new_from_str("m_r45apt2swza6wp8j2z10237t92kkr8"),
    ];

    for ar in CommonAspectRatio::iter() {
      println!("--- image-edit aspect ratio: {:?} ---", ar);
      let request = GenerateImageRequest {
        prompt: Some("Change the background to a spooky haunted house"),
        image_inputs: Some(ImageListRef::MediaFileTokens(&image_tokens)),
        aspect_ratio: Some(ar),
        image_batch_count: Some(1),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_seedream_4p5_image_request()
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
