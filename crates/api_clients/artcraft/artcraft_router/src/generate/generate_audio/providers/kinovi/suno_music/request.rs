use seedance2pro_client::generate::audio::generate_suno_music::{
  generate_suno_music, GenerateSunoMusicArgs, GenerateSunoMusicRequest,
};

use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_audio::generate_audio_response::{
  GenerateAudioResponse, Seedance2proAudioResponsePayload,
};

#[derive(Debug, Clone)]
pub struct KinoviSunoMusicRequestState {
  /// Final materialized request; ready to fire.
  pub request: GenerateSunoMusicRequest,
}

impl KinoviSunoMusicRequestState {
  pub async fn send(&self, client: &RouterSeedance2ProClient) -> Result<GenerateAudioResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateSunoMusicArgs {
      session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_suno_music(args)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

    Ok(GenerateAudioResponse::Seedance2Pro(Seedance2proAudioResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
    }))
  }
}

#[cfg(test)]
mod tests {
  use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;

  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::router_client::RouterClient;
  use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
  use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
  use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
  use crate::generate::generate_audio::generate_audio_response::GenerateAudioResponse;

  #[tokio::test]
  #[ignore] // Sends a real generation to Kinovi; costs credits.
  async fn music_with_vocals() {
    let response = run_pipeline(GenerateAudioRequestBuilder {
      prompt: Some("A song about a corgi who learns to sail the open sea".to_string()),
      style_prompt: Some("Sea shanty, folk".to_string()),
      ..suno_music_builder()
    }).await;
    assert!(matches!(response, GenerateAudioResponse::Seedance2Pro(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // Sends a real generation to Kinovi; costs credits.
  async fn music_instrumental() {
    let response = run_pipeline(GenerateAudioRequestBuilder {
      prompt: Some("An epic journey across a frozen mountain range".to_string()),
      style_prompt: Some("Cinematic orchestral score".to_string()),
      is_instrumental: Some(true),
      ..suno_music_builder()
    }).await;
    assert!(matches!(response, GenerateAudioResponse::Seedance2Pro(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn suno_music_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoMusic,
      provider: RouterProvider::Seedance2Pro,
      ..Default::default()
    }
  }

  fn get_seedance2pro_client() -> RouterClient {
    let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/seedance2pro_cookies.txt")
      .expect("Failed to read seedance2pro cookies");
    let session = Seedance2ProSession::from_cookies_string(cookies.trim().to_string());
    RouterClient::Seedance2Pro(RouterSeedance2ProClient::new(session))
  }

  async fn run_pipeline(builder: GenerateAudioRequestBuilder) -> GenerateAudioResponse {
    let client = get_seedance2pro_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      AudioGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Suno Music skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateAudioResponse::Seedance2Pro(p) => {
        println!("task_id={}, order_id={}", p.task_id, p.order_id);
      }
      other => println!("response: {:?}", other),
    }

    response
  }
}
