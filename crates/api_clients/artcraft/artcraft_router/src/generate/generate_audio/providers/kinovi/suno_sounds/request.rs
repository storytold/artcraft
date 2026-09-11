use kinovi_web_client::generate::audio::generate_suno_sound::{
  generate_suno_sound, GenerateSunoSoundArgs, GenerateSunoSoundRequest,
};

use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_audio::generate_audio_response::{
  GenerateAudioResponse, KinoviWebAudioResponsePayload,
};

#[derive(Debug, Clone)]
pub struct KinoviSunoSoundsRequestState {
  /// Final materialized request; ready to fire.
  pub request: GenerateSunoSoundRequest,
}

impl KinoviSunoSoundsRequestState {
  pub async fn send(&self, client: &RouterKinoviWebClient) -> Result<GenerateAudioResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateSunoSoundArgs {
      session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_suno_sound(args)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::KinoviWeb(err)))?;

    Ok(GenerateAudioResponse::KinoviWeb(KinoviWebAudioResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
    }))
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_musical_key::CommonMusicalKey;
  use kinovi_web_client::creds::kinovi_web_session::KinoviWebSession;

  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::router_client::RouterClient;
  use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
  use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
  use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
  use crate::generate::generate_audio::generate_audio_response::GenerateAudioResponse;

  #[tokio::test]
  #[ignore] // Sends a real generation to Kinovi; costs credits.
  async fn single_hit() {
    let response = run_pipeline(GenerateAudioRequestBuilder {
      prompt: Some("A heavy castle door creaking open".to_string()),
      ..suno_sounds_builder()
    }).await;
    assert!(matches!(response, GenerateAudioResponse::KinoviWeb(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // Sends a real generation to Kinovi; costs credits.
  async fn loop_with_bpm_and_key() {
    let response = run_pipeline(GenerateAudioRequestBuilder {
      prompt: Some("Lo-fi vinyl crackle groove".to_string()),
      is_loopable: Some(true),
      bpm: Some(85),
      musical_key: Some(CommonMusicalKey::AMinor),
      ..suno_sounds_builder()
    }).await;
    assert!(matches!(response, GenerateAudioResponse::KinoviWeb(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn suno_sounds_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoSounds,
      provider: RouterProvider::KinoviWeb,
      ..Default::default()
    }
  }

  fn get_kinovi_web_client() -> RouterClient {
    let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/seedance2pro_cookies.txt")
      .expect("Failed to read kinovi_web cookies");
    let session = KinoviWebSession::from_cookies_string(cookies.trim().to_string());
    RouterClient::KinoviWeb(RouterKinoviWebClient::new(session))
  }

  async fn run_pipeline(builder: GenerateAudioRequestBuilder) -> GenerateAudioResponse {
    let client = get_kinovi_web_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      AudioGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Suno Sounds skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateAudioResponse::KinoviWeb(p) => {
        println!("task_id={}, order_id={}", p.task_id, p.order_id);
      }
      other => println!("response: {:?}", other),
    }

    response
  }
}
