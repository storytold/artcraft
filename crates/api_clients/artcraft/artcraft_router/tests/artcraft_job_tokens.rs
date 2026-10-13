use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;
use artcraft_router::api::router_audio_model::RouterAudioModel;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::api::router_video_model::RouterVideoModel;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
use artcraft_router::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::task::JoinHandle;

const JOBS: [&str; 3] = ["job_primary", "job_second", "job_third"];
const TIMEOUT: Duration = Duration::from_secs(5);

#[tokio::test]
async fn video_preserves_batch_and_single_job_tokens() {
  for jobs in [&JOBS[..], &JOBS[..1], &[JOBS[1], JOBS[0], JOBS[2]], &[]] {
    let (client, server) = serve_jobs("video", jobs).await;
    let builder = GenerateVideoRequestBuilder { model: RouterVideoModel::Seedance1p5Pro, provider: RouterProvider::Artcraft, prompt: Some("test video".to_string()), video_batch_count: Some(jobs.len().max(1) as u16), ..Default::default() };
    let VideoGenerationDraftOrRequest::Request(request) = builder.build2().unwrap() else {
      panic!("Artcraft should create a ready request");
    };
    let response = tokio::time::timeout(TIMEOUT, request.send_request(&client)).await.unwrap().unwrap();
    let payload = response.get_artcraft_payload().unwrap();
    assert_eq!(payload.inference_job_token.as_str(), JOBS[0]);
    assert_eq!(payload.all_inference_job_tokens.iter().map(|token| token.as_str()).collect::<Vec<_>>(), jobs);
    server.await.unwrap();
  }
}

#[tokio::test]
async fn audio_preserves_batch_and_single_job_tokens() {
  for jobs in [&JOBS[..], &JOBS[..1], &[JOBS[1], JOBS[0], JOBS[2]], &[]] {
    let (client, server) = serve_jobs("audio", jobs).await;
    let builder = GenerateAudioRequestBuilder { model: RouterAudioModel::SunoMusic, provider: RouterProvider::Artcraft, prompt: Some("test music".to_string()), ..Default::default() };
    let AudioGenerationDraftOrRequest::Request(request) = builder.build2().unwrap() else {
      panic!("Artcraft should create a ready request");
    };
    let response = tokio::time::timeout(TIMEOUT, request.send_request(&client)).await.unwrap().unwrap();
    let payload = response.get_artcraft_payload().unwrap();
    assert_eq!(payload.inference_job_token.as_str(), JOBS[0]);
    assert_eq!(payload.all_inference_job_tokens.iter().map(|token| token.as_str()).collect::<Vec<_>>(), jobs);
    server.await.unwrap();
  }
}

async fn serve_jobs(modality: &'static str, jobs: &[&str]) -> (RouterClient, JoinHandle<()>) {
  let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
  let port = listener.local_addr().unwrap().port();
  let body = serde_json::json!({
    "success": true,
    "inference_job_token": JOBS[0],
    "all_job_tokens": jobs,
  })
  .to_string();
  let server = tokio::spawn(async move {
    let (mut stream, _) = tokio::time::timeout(TIMEOUT, listener.accept()).await.unwrap().unwrap();
    let mut request = Vec::new();
    let mut buffer = [0; 4096];
    loop {
      let count = tokio::time::timeout(TIMEOUT, stream.read(&mut buffer)).await.unwrap().unwrap();
      assert_ne!(count, 0, "request ended before its body");
      request.extend_from_slice(&buffer[..count]);
      if let Some(end) = request.windows(4).position(|bytes| bytes == b"\r\n\r\n") {
        let headers = std::str::from_utf8(&request[..end]).unwrap();
        assert!(headers.starts_with(&format!("POST /v1/omni_gen/generate/{modality} HTTP/1.1")));
        let length = headers
          .lines()
          .find_map(|line| {
            let (name, value) = line.split_once(':')?;
            name.eq_ignore_ascii_case("content-length").then(|| value.trim().parse::<usize>().unwrap())
          })
          .unwrap();
        if request.len() >= end + 4 + length {
          break;
        }
      }
    }
    let response = format!("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
    stream.write_all(response.as_bytes()).await.unwrap();
  });
  let client = RouterClient::Artcraft(RouterArtcraftClient::new(ApiHost::Localhost { port: u32::from(port) }, StorytellerCredentialSet::empty()));
  (client, server)
}
