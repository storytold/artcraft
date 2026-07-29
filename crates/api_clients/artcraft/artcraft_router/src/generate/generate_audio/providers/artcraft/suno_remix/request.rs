use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_audio_cost_and_generate_request::OmniGenAudioCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::generate_audio_response::GenerateAudioResponse;
use crate::generate::generate_audio::providers::artcraft::request_common::send_artcraft_omni_audio_request;

#[derive(Clone, Debug)]
pub struct ArtcraftSunoRemixRequestState {
  pub request: OmniGenAudioCostAndGenerateRequest,
}

impl ArtcraftSunoRemixRequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateAudioResponse, ArtcraftRouterError> {
    send_artcraft_omni_audio_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::utils::api_host::ApiHost;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::router_artcraft_client::RouterArtcraftClient;
  use crate::client::router_client::RouterClient;
  use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
  use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
  use crate::generate::generate_audio::generate_audio_response::GenerateAudioResponse;

  /// Replace with a real uploaded audio media token before running.
  /// (test_data doesn't have a production audio media token yet.)
  const AUDIO_MEDIA_TOKEN: &str = "m_replace_with_uploaded_audio_token";

  #[tokio::test]
  #[ignore] // sends a real generation to the Artcraft backend, incurs cost
  async fn remix_uploaded_audio() {
    let response = run_pipeline(GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoRemix,
      provider: RouterProvider::Artcraft,
      prompt: Some("Make this electronic".to_string()),
      style_prompt: Some("EDM style".to_string()),
      audio_references: Some(AudioListRef::MediaFileTokens(vec![
        MediaFileToken::new(AUDIO_MEDIA_TOKEN.to_string()),
      ])),
      ..Default::default()
    }).await;
    assert!(matches!(response, GenerateAudioResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn get_artcraft_client() -> RouterClient {
    let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/artcraft_cookies.txt")
      .expect("Failed to read artcraft cookies");
    let cookies = cookies.trim().to_string();
    let credentials = StorytellerCredentialSet::parse_multi_cookie_header(&cookies)
      .expect("Failed to parse cookies")
      .expect("No credentials found");
    RouterClient::Artcraft(RouterArtcraftClient::new(ApiHost::Storyteller, credentials))
  }

  async fn run_pipeline(builder: GenerateAudioRequestBuilder) -> GenerateAudioResponse {
    let client = get_artcraft_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      AudioGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Artcraft skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateAudioResponse::Artcraft(p) => {
        println!("inference_job_token={:?}", p.inference_job_token);
        println!("all_inference_job_tokens={:?}", p.all_inference_job_tokens);
      }
      other => println!("response: {:?}", other),
    }

    response
  }
}
