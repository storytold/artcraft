use seedance2pro_client::generate::image::generate_midjourney_v8::{
  generate_midjourney_v8, GenerateMidjourneyV8Args, GenerateMidjourneyV8Request,
};

use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  GenerateImageResponse, Seedance2proImageResponsePayload,
};

#[derive(Debug, Clone)]
pub struct KinoviMidjourney8RequestState {
  pub request: GenerateMidjourneyV8Request,
}

impl KinoviMidjourney8RequestState {
  pub async fn send(
    &self,
    client: &RouterSeedance2ProClient,
  ) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let args = GenerateMidjourneyV8Args {
      session: &client.session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_midjourney_v8(args)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

    Ok(GenerateImageResponse::Seedance2Pro(Seedance2proImageResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
      maybe_order_ids: response.order_ids,
      maybe_task_ids: response.task_ids,
    }))
  }
}

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::client::router_client::RouterClient;
  use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use crate::generate::generate_image::image_generation_draft::ImageGenerationDraftRequest;
  use crate::generate::generate_image::image_generation_draft_context::ImageGenerationDraftContext;
  use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
  use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::Midjourney8,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("a spooky horror scene with ghosts in an abandoned mansion".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      quality: None,
      image_batch_count: Some(1),
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  fn get_kinovi_client() -> RouterClient {
    let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/seedance2pro_cookies.txt")
      .expect("Failed to read seedance2pro cookies");
    let session = Seedance2ProSession::from_cookies_string(cookies.trim().to_string());
    RouterClient::Seedance2Pro(RouterSeedance2ProClient::new(session))
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies; costs credits
  async fn text_to_image_round_trip() {
    let client = get_kinovi_client();
    let result = base_builder().build2().expect("build2");

    let request = match result {
      ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviMidjourney8(r)) => r,
      _ => panic!("expected direct Request for text-to-image"),
    };

    let response = request.send(client.get_seedance2pro_client_ref().unwrap())
      .await.expect("send should succeed");
    let payload = response.get_seedance2pro_payload().expect("expected seedance2pro payload");
    println!("v8 t2i — task_id={}, order_id={}", payload.task_id, payload.order_id);
    assert!(!payload.task_id.is_empty());
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies; costs credits
  async fn image_reference_round_trip_via_draft() {
    let client = get_kinovi_client();
    let token = MediaFileToken::new("mf_test_juno_v8".to_string());

    let mut map = HashMap::new();
    map.insert(token.clone(), JUNO_AT_LAKE_IMAGE_URL.to_string());

    let builder = GenerateImageRequestBuilder {
      prompt: Some("a dramatic painterly portrait inspired by @1".to_string()),
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![token])),
      ..base_builder()
    };

    let draft_or_request = builder.build2().expect("build2");
    let draft = match draft_or_request {
      ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviMidjourney8(d)) => d,
      _ => panic!("expected Draft for image-input flow"),
    };

    let ctx = ImageGenerationDraftContext {
      client: Some(&client),
      media_file_to_artcraft_url_map: Some(&map),
    };

    let request = ImageGenerationDraftRequest::KinoviMidjourney8(draft)
      .finalize(ctx).await.expect("finalize");

    let response = request.send_request(&client).await.expect("send_request");
    let payload = response.get_seedance2pro_payload().expect("expected seedance2pro payload");
    println!("v8 with ref — task_id={}, order_id={}", payload.task_id, payload.order_id);
    assert!(!payload.task_id.is_empty());
  }
}
