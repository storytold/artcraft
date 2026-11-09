use std::time::Duration;

use reqwest::header::{HeaderValue, AUTHORIZATION};
use reqwest::{Client, Response, Url};
use serde::{Deserialize, Serialize};
use thiserror::Error;

const API_BASE: &str = "https://api.wavespeed.ai/api/v3/";

pub mod image_model;
pub use image_model::ImageModel;
pub mod video_model;
pub use video_model::VideoModel;

#[derive(Clone)]
pub struct WaveSpeedClient {
  client: Client,
  authorization: HeaderValue,
  base_url: Url,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct GenerateImageRequest {
  pub prompt: String,
  #[serde(rename = "size", skip_serializing_if = "Option::is_none")]
  pub maybe_size: Option<String>,
  #[serde(rename = "num_images", skip_serializing_if = "Option::is_none")]
  pub maybe_num_images: Option<u16>,
  #[serde(rename = "image", skip_serializing_if = "Option::is_none")]
  pub maybe_image: Option<String>,
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub images: Vec<String>,
  #[serde(rename = "aspect_ratio", skip_serializing_if = "Option::is_none")]
  pub maybe_aspect_ratio: Option<String>,
  #[serde(rename = "resolution", skip_serializing_if = "Option::is_none")]
  pub maybe_resolution: Option<String>,
  #[serde(rename = "quality", skip_serializing_if = "Option::is_none")]
  pub maybe_quality: Option<String>,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct GenerateVideoRequest {
  #[serde(skip)]
  pub mode: VideoMode,
  #[serde(rename = "video", skip_serializing_if = "Option::is_none")]
  pub maybe_video: Option<String>,
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub reference_images: Vec<String>,
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub reference_videos: Vec<String>,
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub reference_audios: Vec<String>,
  pub prompt: String,
  pub duration: u16,
  #[serde(rename = "image", skip_serializing_if = "Option::is_none")]
  pub maybe_image: Option<String>,
  #[serde(rename = "last_image", skip_serializing_if = "Option::is_none")]
  pub maybe_last_image: Option<String>,
  #[serde(rename = "aspect_ratio", skip_serializing_if = "Option::is_none")]
  pub maybe_aspect_ratio: Option<String>,
  #[serde(rename = "resolution", skip_serializing_if = "Option::is_none")]
  pub maybe_resolution: Option<String>,
  #[serde(rename = "size", skip_serializing_if = "Option::is_none")]
  pub maybe_size: Option<String>,
  #[serde(rename = "negative_prompt", skip_serializing_if = "Option::is_none")]
  pub maybe_negative_prompt: Option<String>,
  #[serde(rename = "generate_audio", skip_serializing_if = "Option::is_none")]
  pub maybe_generate_audio: Option<bool>,
  #[serde(rename = "sound", skip_serializing_if = "Option::is_none")]
  pub maybe_sound: Option<bool>,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VideoMode {
  #[default]
  Generate,
  Reference,
  Edit,
  Extend,
}

#[derive(Clone, Debug, Deserialize)]
pub struct Prediction {
  pub id: String,
  pub status: PredictionStatus,
  #[serde(default)]
  pub outputs: Vec<String>,
  #[serde(default, rename = "error")]
  pub maybe_error: Option<String>,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PredictionStatus {
  Created,
  Pending,
  Processing,
  Completed,
  Failed,
  Cancelled,
  Timeout,
  Deleted,
  #[serde(other)]
  Unknown,
}

#[derive(Debug, Error)]
pub enum WaveSpeedError {
  #[error("Invalid WaveSpeed API key")]
  InvalidApiKey,
  #[error("WaveSpeed authentication failed; check your API key")]
  Authentication,
  #[error("WaveSpeed credits are insufficient")]
  Billing,
  #[error("WaveSpeed returned HTTP {0}")]
  Http(u16),
  #[error("WaveSpeed returned API code {0}")]
  Api(u16),
  #[error("Invalid WaveSpeed response: {0}")]
  InvalidResponse(&'static str),
  #[error("WaveSpeed request failed: {0}")]
  Transport(#[from] reqwest::Error),
}

#[derive(Deserialize)]
struct ApiResponse {
  code: u16,
  #[serde(rename = "data")]
  maybe_data: Option<Prediction>,
}

impl WaveSpeedClient {
  pub fn new(api_key: &str) -> Result<Self, WaveSpeedError> {
    let api_key = api_key.trim();
    if api_key.is_empty() {
      return Err(WaveSpeedError::InvalidApiKey);
    }
    let mut authorization = HeaderValue::from_str(&format!("Bearer {api_key}")).map_err(|_| WaveSpeedError::InvalidApiKey)?;
    authorization.set_sensitive(true);
    let client = Client::builder().connect_timeout(Duration::from_secs(10)).timeout(Duration::from_secs(60)).redirect(reqwest::redirect::Policy::none()).retry(reqwest::retry::never()).build()?;
    Ok(Self { client, authorization, base_url: Url::parse(API_BASE).unwrap() })
  }

  pub async fn generate_image(&self, model: ImageModel, request: &GenerateImageRequest) -> Result<Prediction, WaveSpeedError> {
    let endpoint = model.endpoint(!request.images.is_empty() || request.maybe_image.is_some());
    let response = self.client.post(self.base_url.join(endpoint).unwrap()).header(AUTHORIZATION, self.authorization.clone()).json(request).send().await?;
    self.decode(response).await
  }

  pub async fn get_prediction(&self, prediction_id: &str) -> Result<Prediction, WaveSpeedError> {
    if prediction_id.is_empty() || !prediction_id.bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_') {
      return Err(WaveSpeedError::InvalidResponse("invalid prediction ID"));
    }
    let url = self.base_url.join(&format!("predictions/{prediction_id}/result")).unwrap();
    let response = self.client.get(url).header(AUTHORIZATION, self.authorization.clone()).send().await?;
    self.decode(response).await
  }

  pub async fn generate_video(&self, model: VideoModel, request: &GenerateVideoRequest) -> Result<Prediction, WaveSpeedError> {
    let endpoint = match request.mode {
      VideoMode::Generate => model.endpoint(request.maybe_image.is_some()),
      mode => match (model, mode) {
        (VideoModel::Seedance2p0, VideoMode::Reference) => Some("bytedance/seedance-2.0/reference-to-video"),
        (VideoModel::Seedance2p0, VideoMode::Edit) => Some("bytedance/seedance-2.0/video-edit"),
        (VideoModel::Seedance2p0, VideoMode::Extend) => Some("bytedance/seedance-2.0/video-extend"),
        _ => None,
      },
    }
    .ok_or(WaveSpeedError::InvalidResponse("this video model does not support the requested input mode"))?;
    let response = self.client.post(self.base_url.join(endpoint).unwrap()).header(AUTHORIZATION, self.authorization.clone()).json(request).send().await?;
    self.decode(response).await
  }

  async fn decode(&self, response: Response) -> Result<Prediction, WaveSpeedError> {
    let status = response.status().as_u16();
    match status {
      401 | 403 => return Err(WaveSpeedError::Authentication),
      402 => return Err(WaveSpeedError::Billing),
      200..=299 => {},
      _ => return Err(WaveSpeedError::Http(status)),
    }
    let envelope = response.json::<ApiResponse>().await?;
    match envelope.code {
      200..=299 => {},
      401 | 403 => return Err(WaveSpeedError::Authentication),
      402 => return Err(WaveSpeedError::Billing),
      code => return Err(WaveSpeedError::Api(code)),
    }
    let prediction = envelope.maybe_data.ok_or(WaveSpeedError::InvalidResponse("missing prediction data"))?;
    if prediction.id.is_empty() {
      return Err(WaveSpeedError::InvalidResponse("missing prediction ID"));
    }
    Ok(prediction)
  }
}

impl PredictionStatus {
  pub fn is_failure(self) -> bool {
    matches!(self, Self::Failed | Self::Cancelled | Self::Timeout | Self::Deleted)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::io::{Read, Write};
  use std::net::TcpListener;
  use std::thread;

  #[tokio::test]
  async fn advanced_video_modes_use_explicit_documented_endpoints_without_leaking_mode() {
    for (mode, suffix) in [(VideoMode::Reference, "reference-to-video"), (VideoMode::Edit, "video-edit"), (VideoMode::Extend, "video-extend")] {
      let (client, server) = mock_client(200, r#"{"code":200,"data":{"id":"video-123","status":"processing","outputs":[]}}"#);
      client.generate_video(VideoModel::Seedance2p0, &GenerateVideoRequest { mode, prompt: "a scene".into(), duration: 5, maybe_video: (mode != VideoMode::Reference).then(|| "https://example.com/source.mp4".into()), ..Default::default() }).await.unwrap();
      let request = server.join().unwrap();
      assert!(request.starts_with(&format!("POST /bytedance/seedance-2.0/{suffix} HTTP/1.1")));
      let body: serde_json::Value = serde_json::from_str(request.split("\r\n\r\n").nth(1).unwrap()).unwrap();
      assert!(body.get("mode").is_none());
      assert!(body.get("image").is_none());
    }
  }

  #[tokio::test]
  async fn submits_bearer_authenticated_flux_request() {
    let (client, server) = mock_client(200, r#"{"code":200,"data":{"id":"task-123","status":"created","outputs":[]}}"#);
    let prediction = client.generate_image(ImageModel::FluxDev, &GenerateImageRequest { prompt: "a wave".into(), maybe_size: Some("1024*1024".into()), maybe_num_images: Some(2), ..Default::default() }).await.unwrap();
    assert_eq!(prediction.id, "task-123");
    let request = server.join().unwrap();
    assert!(request.starts_with("POST /wavespeed-ai/flux-dev HTTP/1.1"));
    assert!(request.to_lowercase().contains("authorization: bearer test-key"));
    let body: serde_json::Value = serde_json::from_str(request.split("\r\n\r\n").nth(1).unwrap()).unwrap();
    assert_eq!(body["num_images"], 2);
    assert_eq!(body["size"], "1024*1024");
    assert!(body.get("image").is_none());
  }

  #[tokio::test]
  async fn polls_completed_prediction() {
    let (client, server) = mock_client(200, r#"{"code":200,"data":{"id":"task-123","status":"completed","outputs":["https://example.com/image.png"],"error":null}}"#);
    let prediction = client.get_prediction("task-123").await.unwrap();
    assert_eq!(prediction.status, PredictionStatus::Completed);
    assert_eq!(prediction.outputs, ["https://example.com/image.png"]);
    assert!(server.join().unwrap().starts_with("GET /predictions/task-123/result HTTP/1.1"));
  }

  #[tokio::test]
  async fn maps_http_and_envelope_errors() {
    for (status, body, expected) in [(401, "{}", "authentication"), (402, "{}", "credits"), (200, r#"{"code":402,"data":null}"#, "credits"), (200, r#"{"code":200,"data":null}"#, "missing prediction data")] {
      let (client, server) = mock_client(status, body);
      let error = client.get_prediction("task-123").await.unwrap_err();
      assert!(error.to_string().contains(expected), "{error}");
      server.join().unwrap();
    }
  }

  #[test]
  fn recognizes_all_terminal_failures_and_unknown_statuses() {
    for status in ["failed", "cancelled", "timeout", "deleted"] {
      let parsed: PredictionStatus = serde_json::from_value(serde_json::json!(status)).unwrap();
      assert!(parsed.is_failure());
    }
    let unknown: PredictionStatus = serde_json::from_str("\"new_status\"").unwrap();
    assert_eq!(unknown, PredictionStatus::Unknown);
    assert!(!unknown.is_failure());
  }

  #[tokio::test]
  async fn rejects_invalid_prediction_paths_without_network_access() {
    let client = WaveSpeedClient::new("test-key").unwrap();
    for prediction_id in ["", "../another-endpoint", "task?id=secret"] {
      assert!(matches!(client.get_prediction(prediction_id).await, Err(WaveSpeedError::InvalidResponse(_))));
    }
  }

  #[tokio::test]
  async fn does_not_resubmit_when_submission_fails() {
    let (client, server) = mock_client(500, "{}");
    let error = client.generate_image(ImageModel::FluxSchnell, &GenerateImageRequest { prompt: "a wave".into(), maybe_size: Some("1024*1024".into()), maybe_num_images: Some(1), ..Default::default() }).await.unwrap_err();
    assert!(matches!(error, WaveSpeedError::Http(500)));
    assert!(server.join().unwrap().starts_with("POST /wavespeed-ai/flux-schnell HTTP/1.1"));
  }

  #[test]
  fn rejects_empty_and_malformed_keys() {
    assert!(matches!(WaveSpeedClient::new("  "), Err(WaveSpeedError::InvalidApiKey)));
    assert!(matches!(WaveSpeedClient::new("key\ninjected"), Err(WaveSpeedError::InvalidApiKey)));
  }

  #[tokio::test]
  async fn submits_seedance_video_with_the_documented_endpoint_and_payload() {
    let (client, server) = mock_client(200, r#"{"code":200,"data":{"id":"video-123","status":"processing","outputs":[]}}"#);
    let prediction = client.generate_video(VideoModel::Seedance2p5, &GenerateVideoRequest { prompt: "ocean waves".into(), duration: 30, maybe_resolution: Some("4k".into()), maybe_image: Some("https://example.com/start.png".into()), ..Default::default() }).await.unwrap();
    assert_eq!(prediction.id, "video-123");
    let request = server.join().unwrap();
    assert!(request.starts_with("POST /bytedance/seedance-2.5/image-to-video HTTP/1.1"));
    let body: serde_json::Value = serde_json::from_str(request.split("\r\n\r\n").nth(1).unwrap()).unwrap();
    assert_eq!(body["duration"], 30);
    assert_eq!(body["resolution"], "4k");
    assert!(body.get("num_images").is_none());
  }

  #[tokio::test]
  async fn submits_multireference_image_edits_without_flux_fields() {
    let (client, server) = mock_client(200, r#"{"code":200,"data":{"id":"image-123","status":"created","outputs":[]}}"#);
    client.generate_image(ImageModel::NanoBananaPro, &GenerateImageRequest { prompt: "combine these".into(), images: vec!["https://example.com/a.png".into(), "https://example.com/b.png".into()], maybe_resolution: Some("4k".into()), ..Default::default() }).await.unwrap();
    let request = server.join().unwrap();
    assert!(request.starts_with("POST /google/nano-banana-pro/edit HTTP/1.1"));
    let body: serde_json::Value = serde_json::from_str(request.split("\r\n\r\n").nth(1).unwrap()).unwrap();
    assert_eq!(body["images"].as_array().unwrap().len(), 2);
    assert!(body.get("image").is_none());
    assert!(body.get("size").is_none());
    assert!(body.get("num_images").is_none());
  }

  fn mock_client(status: u16, body: &'static str) -> (WaveSpeedClient, thread::JoinHandle<String>) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let address = listener.local_addr().unwrap();
    let server = thread::spawn(move || {
      let (mut stream, _) = listener.accept().unwrap();
      stream.set_read_timeout(Some(Duration::from_secs(5))).unwrap();
      let mut request = Vec::new();
      let mut buffer = [0; 4096];
      loop {
        let count = stream.read(&mut buffer).unwrap();
        request.extend_from_slice(&buffer[..count]);
        let text = String::from_utf8_lossy(&request);
        if let Some((headers, payload)) = text.split_once("\r\n\r\n") {
          let length = headers.lines().find_map(|line| line.to_lowercase().strip_prefix("content-length: ").and_then(|value| value.parse::<usize>().ok())).unwrap_or(0);
          if payload.len() >= length {
            break;
          }
        }
        assert_ne!(count, 0);
      }
      write!(stream, "HTTP/1.1 {status} OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).unwrap();
      String::from_utf8(request).unwrap()
    });
    let mut client = WaveSpeedClient::new("test-key").unwrap();
    client.base_url = Url::parse(&format!("http://{address}/")).unwrap();
    (client, server)
  }
}
