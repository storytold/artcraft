use kinovi_web_client::generate::audio::generate_suno_remix::{
  generate_suno_remix, GenerateSunoRemixArgs, GenerateSunoRemixRequest,
};

use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_audio::generate_audio_response::{
  GenerateAudioResponse, KinoviWebAudioResponsePayload,
};

#[derive(Debug, Clone)]
pub struct KinoviSunoRemixRequestState {
  /// Final materialized request; ready to fire. The audio source has been
  /// re-uploaded to the Kinovi CDN by the draft's `to_request()`.
  pub request: GenerateSunoRemixRequest,
}

impl KinoviSunoRemixRequestState {
  pub async fn send(&self, client: &RouterKinoviWebClient) -> Result<GenerateAudioResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateSunoRemixArgs {
      session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_suno_remix(args)
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
  use kinovi_web_client::creds::kinovi_web_session::KinoviWebSession;
  use kinovi_web_client::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use kinovi_web_client::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
  use test_utils::test_file_path::test_file_path;

  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::router_client::RouterClient;
  use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
  use crate::generate::generate_audio::audio_generation_draft_context::AudioGenerationDraftContext;
  use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
  use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
  use crate::generate::generate_audio::generate_audio_response::GenerateAudioResponse;

  const TEST_AUDIO_PATH: &str = "test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3";

  #[tokio::test]
  #[ignore] // Sends a real generation to Kinovi; costs credits. Requires a local audio file.
  async fn remix_uploaded_audio() {
    let client = get_kinovi_web_client();
    let audio_url = upload_test_audio(&client).await;
    println!("Uploaded audio: {}", audio_url);

    let builder = GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoRemix,
      provider: RouterProvider::KinoviWeb,
      prompt: Some("Make this electronic".to_string()),
      style_prompt: Some("EDM style".to_string()),
      audio_references: Some(AudioListRef::Urls(vec![audio_url])),
      ..Default::default()
    };

    let response = run_pipeline(&client, builder).await;
    assert!(matches!(response, GenerateAudioResponse::KinoviWeb(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn get_kinovi_web_client() -> RouterClient {
    let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/seedance2pro_cookies.txt")
      .expect("Failed to read kinovi_web cookies");
    let session = KinoviWebSession::from_cookies_string(cookies.trim().to_string());
    RouterClient::KinoviWeb(RouterKinoviWebClient::new(session))
  }

  async fn run_pipeline(client: &RouterClient, builder: GenerateAudioRequestBuilder) -> GenerateAudioResponse {
    let draft_or_request = builder.build2().expect("build2 should succeed");
    let draft = match draft_or_request {
      AudioGenerationDraftOrRequest::Draft(d) => d,
      _ => panic!("expected Draft variant (Suno Remix uses the draft phase)"),
    };

    let draft_context = AudioGenerationDraftContext {
      client: Some(client),
      ..Default::default()
    };

    let request = draft.finalize(draft_context).await.expect("finalize should succeed");
    let response = request.send_request(client).await.expect("send_request should succeed");

    match &response {
      GenerateAudioResponse::KinoviWeb(p) => {
        println!("task_id={}, order_id={}", p.task_id, p.order_id);
      }
      other => println!("response: {:?}", other),
    }

    response
  }

  async fn upload_test_audio(client: &RouterClient) -> String {
    let session = &client.get_kinovi_web_client_ref().expect("kinovi_web client").session;

    let audio_path = test_file_path(TEST_AUDIO_PATH).expect("test audio should exist");
    let audio_bytes = std::fs::read(&audio_path).expect("read test audio");

    let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
      session,
      extension: "mp3".to_string(),
      host_override: None,
    }).await.expect("prepare upload");

    let upload_result = upload_file(UploadFileArgs {
      upload_url: prepare_result.upload_url,
      file_bytes: audio_bytes,
      host_override: None,
    }).await.expect("upload");

    upload_result.public_url
  }
}
