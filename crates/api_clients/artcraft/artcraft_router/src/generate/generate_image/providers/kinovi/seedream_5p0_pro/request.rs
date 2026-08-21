use kinovi_web_client::generate::image::generate_seedream_5p0_pro::{
  generate_seedream_5p0_pro, GenerateSeedream5p0ProArgs, GenerateSeedream5p0ProRequest,
};

use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  GenerateImageResponse, KinoviWebImageResponsePayload,
};

#[derive(Debug, Clone)]
pub struct KinoviSeedream5p0ProRequestState {
  pub request: GenerateSeedream5p0ProRequest,
}

impl KinoviSeedream5p0ProRequestState {
  pub async fn send(
    &self,
    client: &RouterKinoviWebClient,
  ) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let args = GenerateSeedream5p0ProArgs {
      session: &client.session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_seedream_5p0_pro(args)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::KinoviWeb(err)))?;

    Ok(GenerateImageResponse::KinoviWeb(KinoviWebImageResponsePayload {
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

  use kinovi_web_client::creds::kinovi_web_session::KinoviWebSession;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::client::router_client::RouterClient;
  use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use crate::generate::generate_image::image_generation_draft::ImageGenerationDraftRequest;
  use crate::generate::generate_image::image_generation_draft_context::ImageGenerationDraftContext;
  use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
  use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::Seedream5p0Pro,
      provider: RouterProvider::KinoviWeb,
      prompt: Some("an anime girl riding a dinosaur through a neon city".to_string()),
      image_inputs: None,
      resolution: Some(RouterResolution::OneK),
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
      .expect("Failed to read kinovi_web cookies");
    let session = KinoviWebSession::from_cookies_string(cookies.trim().to_string());
    RouterClient::KinoviWeb(RouterKinoviWebClient::new(session))
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies; costs credits
  async fn text_to_image_round_trip() {
    let client = get_kinovi_client();
    let result = base_builder().build2().expect("build2");

    let request = match result {
      ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviSeedream5p0Pro(r)) => r,
      _ => panic!("expected direct Request for text-to-image"),
    };

    let response = request.send(client.get_kinovi_web_client_ref().unwrap())
      .await.expect("send should succeed");
    let payload = response.get_kinovi_web_payload().expect("expected kinovi_web payload");
    println!("seedream 5.0 pro t2i — task_id={}, order_id={}", payload.task_id, payload.order_id);
    assert!(!payload.task_id.is_empty());
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies; costs credits
  async fn image_reference_round_trip_via_draft() {
    let client = get_kinovi_client();
    let token = MediaFileToken::new("mf_test_juno_seedream5".to_string());

    let mut map = HashMap::new();
    map.insert(token.clone(), JUNO_AT_LAKE_IMAGE_URL.to_string());

    let builder = GenerateImageRequestBuilder {
      prompt: Some("The dog in @Image1 wearing a tiny crown in a royal palace".to_string()),
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![token])),
      ..base_builder()
    };

    let draft_or_request = builder.build2().expect("build2");
    let draft = match draft_or_request {
      ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviSeedream5p0Pro(d)) => d,
      _ => panic!("expected Draft for image-input flow"),
    };

    let ctx = ImageGenerationDraftContext {
      client: Some(&client),
      media_file_to_artcraft_url_map: Some(&map),
    };

    let request = ImageGenerationDraftRequest::KinoviSeedream5p0Pro(draft)
      .finalize(ctx).await.expect("finalize");

    let response = request.send_request(&client).await.expect("send_request");
    let payload = response.get_kinovi_web_payload().expect("expected kinovi_web payload");
    println!("seedream 5.0 pro with ref — task_id={}, order_id={}", payload.task_id, payload.order_id);
    assert!(!payload.task_id.is_empty());
  }
}
