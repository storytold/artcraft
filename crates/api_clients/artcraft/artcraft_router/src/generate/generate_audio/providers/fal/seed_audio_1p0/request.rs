use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::audio::omni::seed_audio_1p0::api::SeedAudio1p0Request;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::generate_audio_response::{
  FalAudioResponsePayload, GenerateAudioResponse,
};

#[derive(Clone, Debug)]
pub struct FalSeedAudio1p0RequestState {
  /// Final materialized request; ready to fire.
  pub request: SeedAudio1p0Request,
}

impl FalSeedAudio1p0RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateAudioResponse, ArtcraftRouterError> {
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(self.request.clone());

    let payload = if let Some(webhook_url) = &client.webhook_url {
      let response = self.request.send_webhook_request(&client.api_key, webhook_url).await?;
      FalAudioResponsePayload {
        request_id: response.request_id,
        gateway_request_id: response.gateway_request_id,
        maybe_status_url: None,
        maybe_response_url: None,
        maybe_outbound_request: Some(outbound),
      }
    } else {
      let response = self.request.send_queue_request(&client.api_key).await?;
      FalAudioResponsePayload {
        request_id: Some(response.request_id),
        gateway_request_id: None,
        maybe_status_url: Some(response.status_url),
        maybe_response_url: Some(response.response_url),
        maybe_outbound_request: Some(outbound),
      }
    };

    Ok(GenerateAudioResponse::Fal(payload))
  }
}

#[cfg(test)]
mod tests {
  use fal_client::creds::fal_api_key::FalApiKey;

  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::router_client::RouterClient;
  use crate::client::router_fal_client::RouterFalClient;
  use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
  use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
  use crate::generate::generate_audio::generate_audio_response::GenerateAudioResponse;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_seed_audio_webhook() {
    let response = run_pipeline(GenerateAudioRequestBuilder {
      prompt: Some("A calm narrator describes ocean waves rolling onto a moonlit beach.".to_string()),
      ..seed_audio_builder()
    }).await;
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_seed_audio_tuned() {
    let response = run_pipeline(GenerateAudioRequestBuilder {
      prompt: Some("Welcome aboard the midnight express. Please keep your arms inside the train.".to_string()),
      sample_rate_hz: Some(44_100),
      speed: Some(0.9),
      volume: Some(1.2),
      pitch: Some(-2.0),
      ..seed_audio_builder()
    }).await;
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn seed_audio_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SeedAudio1p0,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  fn get_fal_client() -> RouterClient {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
      .expect("Failed to read fal_api_key.txt");
    let api_key = FalApiKey::from_str(secret.trim());
    let webhook_url = "https://example.com/fal-webhook-test".to_string();
    RouterClient::Fal(RouterFalClient::new_with_webhook(api_key, webhook_url))
  }

  async fn run_pipeline(builder: GenerateAudioRequestBuilder) -> GenerateAudioResponse {
    let client = get_fal_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      AudioGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Seed Audio skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");
    println!("response: {:?}", response);
    response
  }
}
