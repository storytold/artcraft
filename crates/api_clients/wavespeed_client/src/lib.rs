//! WaveSpeed v3 image/video prediction client.
//!
//! Requests use a bearer API key and `https://api.wavespeed.ai/api/v3/`.
//! Creation is a paid, non-idempotent POST: the client disables automatic retries.
//! If creation times out, check WaveSpeed History before submitting again; no
//! provider idempotency contract is assumed. Polling an existing ID is read-only.
//!
//! ```no_run
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! use wavespeed_client::{GenerateImageRequest, ImageModel, WaveSpeedClient};
//! let client = WaveSpeedClient::new(&std::env::var("WAVESPEED_API_KEY")?)?;
//! let created = client.generate_image(ImageModel::FluxSchnell,
//!   &GenerateImageRequest { prompt: "A watercolor lighthouse".into(), ..Default::default() }).await?;
//! let prediction = client.get_prediction(&created.id).await?;
//! # Ok(()) }
//! ```
//!
//! | HTTP/API code | Error variant     |
//! |---------------|-------------------|
//! | 401, 403      | Authentication    |
//! | 402           | Billing           |
//! | 400, 422      | Rejected          |
//! | 429           | RateLimited       |
//! | Other non-2xx | Http or Api       |
//! | Invalid body  | InvalidResponse   |

use std::time::Duration;

use reqwest::header::{HeaderValue, AUTHORIZATION};
use reqwest::{Client, Response, Url};
use serde::{Deserialize, Serialize};
use thiserror::Error;

const API_BASE: &str = "https://api.wavespeed.ai/api/v3/";
const MAX_RESPONSE_BYTES: usize = 1024 * 1024;
pub const MAX_OUTPUTS: usize = 16;

pub mod image_model;
pub use image_model::ImageModel;
pub mod video_model;
pub use video_model::VideoModel;

#[derive(Clone)]
/// Authenticated prediction client. Creation requests are never retried automatically.
pub struct WaveSpeedClient {
  client: Client,
  authorization: HeaderValue,
  base_url: Url,
}

#[derive(Clone, Debug, Default, Serialize)]
/// Image creation payload; optional fields must match the selected model endpoint.
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
/// Video creation payload; `mode` selects an endpoint and is not sent in JSON.
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
/// Provider failures, preserving HTTP provenance separately from API envelope codes.
pub enum WaveSpeedError {
  #[error("Invalid WaveSpeed API key")]
  InvalidApiKey,
  #[error("WaveSpeed authentication failed; check your API key")]
  Authentication { http_status: u16 },
  #[error("WaveSpeed credits are insufficient")]
  Billing { http_status: u16 },
  #[error("WaveSpeed returned HTTP {status}: {message}")]
  Http { status: u16, message: String },
  #[error("WaveSpeed rejected the request ({code}): {message}")]
  Rejected { http_status: u16, code: u16, message: String },
  #[error("WaveSpeed rate limit reached: {message}")]
  RateLimited { http_status: u16, maybe_retry_after_secs: Option<u64>, message: String },
  #[error("WaveSpeed returned API code {code}: {message}")]
  Api { code: u16, message: String },
  #[error("Invalid WaveSpeed response: {0}")]
  InvalidResponse(&'static str),
  #[error("WaveSpeed request failed: {0}")]
  Transport(#[from] reqwest::Error),
}

#[derive(Deserialize)]
struct ApiResponse {
  code: u16,
  #[serde(default, rename = "message")]
  maybe_message: Option<String>,
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

  async fn decode(&self, mut response: Response) -> Result<Prediction, WaveSpeedError> {
    let status = response.status().as_u16();
    let maybe_retry_after_secs = response.headers().get(reqwest::header::RETRY_AFTER).and_then(|value| value.to_str().ok()).and_then(|value| value.parse::<u64>().ok());
    if response.content_length().is_some_and(|length| length > MAX_RESPONSE_BYTES as u64) {
      return Err(http_rejection(status, "response body is too large".into(), maybe_retry_after_secs).unwrap_or(WaveSpeedError::InvalidResponse("response body is too large")));
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|error| http_rejection(status, "could not read error response".into(), maybe_retry_after_secs).unwrap_or(WaveSpeedError::Transport(error)))? {
      if bytes.len().saturating_add(chunk.len()) > MAX_RESPONSE_BYTES {
        return Err(http_rejection(status, "response body is too large".into(), maybe_retry_after_secs).unwrap_or(WaveSpeedError::InvalidResponse("response body is too large")));
      }
      bytes.extend_from_slice(&chunk);
    }
    let envelope = serde_json::from_slice::<ApiResponse>(&bytes);
    let code = if (200..300).contains(&status) { envelope.as_ref().map(|value| value.code).unwrap_or(status) } else { status };
    let message = envelope.as_ref().ok().and_then(|value| value.maybe_message.clone()).unwrap_or_default();
    match code {
      401 | 403 => return Err(WaveSpeedError::Authentication { http_status: status }),
      402 => return Err(WaveSpeedError::Billing { http_status: status }),
      400 | 422 => return Err(WaveSpeedError::Rejected { http_status: status, code, message }),
      429 => return Err(WaveSpeedError::RateLimited { http_status: status, maybe_retry_after_secs, message }),
      200..=299 => {},
      _ if !(200..300).contains(&status) => return Err(WaveSpeedError::Http { status, message }),
      _ => return Err(WaveSpeedError::Api { code, message }),
    }
    let envelope = envelope.map_err(|_| WaveSpeedError::InvalidResponse("invalid JSON envelope"))?;
    let prediction = envelope.maybe_data.ok_or(WaveSpeedError::InvalidResponse("missing prediction data"))?;
    if prediction.id.is_empty() {
      return Err(WaveSpeedError::InvalidResponse("missing prediction ID"));
    }
    if prediction.outputs.len() > MAX_OUTPUTS {
      return Err(WaveSpeedError::InvalidResponse("too many output files"));
    }
    Ok(prediction)
  }
}

fn http_rejection(status: u16, message: String, maybe_retry_after_secs: Option<u64>) -> Option<WaveSpeedError> {
  match status {
    401 | 403 => Some(WaveSpeedError::Authentication { http_status: status }),
    402 => Some(WaveSpeedError::Billing { http_status: status }),
    400 | 422 => Some(WaveSpeedError::Rejected { http_status: status, code: status, message }),
    429 => Some(WaveSpeedError::RateLimited { http_status: status, maybe_retry_after_secs, message }),
    _ => None,
  }
}

impl WaveSpeedError {
  /// True only for explicit HTTP rejections, never successful envelopes or uncertain failures.
  pub fn is_definitive_submission_rejection(&self) -> bool {
    let status = match self {
      Self::Authentication { http_status } | Self::Billing { http_status }
      | Self::Rejected { http_status, .. } | Self::RateLimited { http_status, .. } => *http_status,
      _ => return false,
    };
    matches!(status, 400 | 401 | 402 | 403 | 422 | 429)
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
  async fn rejects_large_response_bodies_and_excess_output_counts() {
    let (client, server) = mock_client(200, "x".repeat(MAX_RESPONSE_BYTES + 1));
    assert!(matches!(client.get_prediction("task-123").await, Err(WaveSpeedError::InvalidResponse("response body is too large"))));
    let _ = server.join();
    let body = serde_json::json!({"code":200,"data":{"id":"task-123","status":"completed","outputs":vec!["https://example.com/file"; MAX_OUTPUTS + 1]}}).to_string();
    let (client, server) = mock_client(200, body);
    assert!(matches!(client.get_prediction("task-123").await, Err(WaveSpeedError::InvalidResponse("too many output files"))));
    server.join().unwrap();
  }

  #[tokio::test]
  async fn chunked_json_cannot_bypass_the_response_body_limit() {
    let (client, server) = mock_response(200, " ".repeat(MAX_RESPONSE_BYTES + 1), true);
    assert!(matches!(client.get_prediction("task-123").await, Err(WaveSpeedError::InvalidResponse("response body is too large"))));
    let _ = server.join();
  }

  #[tokio::test]
  async fn preserves_validation_messages_and_rate_limit_retry_delay() {
    let (client, server) = mock_client(422, r#"{"code":422,"message":"duration is invalid","data":null}"#);
    assert!(matches!(client.get_prediction("task-123").await, Err(WaveSpeedError::Rejected { http_status: 422, code: 422, message }) if message == "duration is invalid"));
    server.join().unwrap();
    let (client, server) = mock_client(429, r#"{"code":429,"message":"slow down","data":null}"#);
    assert!(matches!(client.get_prediction("task-123").await, Err(WaveSpeedError::RateLimited { http_status: 429, maybe_retry_after_secs: Some(42), message }) if message == "slow down"));
    server.join().unwrap();
  }

  #[tokio::test]
  async fn only_explicit_http_rejections_are_safe_to_discard() {
    for status in [400, 401, 402, 403, 422, 429, 408, 500, 503] {
      let body = format!("{{\"code\":{status},\"data\":null}}");
      let (client, server) = mock_client(status, body.clone());
      let error = client.generate_image(ImageModel::FluxSchnell, &GenerateImageRequest::default()).await.unwrap_err();
      assert_eq!(error.is_definitive_submission_rejection(), matches!(status, 400 | 401 | 402 | 403 | 422 | 429));
      server.join().unwrap();
      let (client, server) = mock_client(200, body);
      assert!(!client.generate_image(ImageModel::FluxSchnell, &GenerateImageRequest::default()).await.unwrap_err().is_definitive_submission_rejection());
      server.join().unwrap();
    }
    let (client, server) = mock_client(401, "x".repeat(MAX_RESPONSE_BYTES + 1));
    assert!(client.generate_image(ImageModel::FluxSchnell, &GenerateImageRequest::default()).await.unwrap_err().is_definitive_submission_rejection());
    let _ = server.join();
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
    assert!(matches!(error, WaveSpeedError::Http { status: 500, .. }));
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

  fn mock_client(status: u16, body: impl Into<String>) -> (WaveSpeedClient, thread::JoinHandle<String>) {
    mock_response(status, body, false)
  }

  fn mock_response(status: u16, body: impl Into<String>, chunked: bool) -> (WaveSpeedClient, thread::JoinHandle<String>) {
    let body = body.into();
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
      let retry = if status == 429 { "Retry-After: 42\r\n" } else { "" };
      if chunked {
        let _ = write!(stream, "HTTP/1.1 {status} OK\r\n{retry}Content-Type: application/json\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n{:x}\r\n{body}\r\n0\r\n\r\n", body.len());
      } else {
        let _ = write!(stream, "HTTP/1.1 {status} OK\r\n{retry}Content-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
      }
      String::from_utf8(request).unwrap()
    });
    let mut client = WaveSpeedClient::new("test-key").unwrap();
    client.base_url = Url::parse(&format!("http://{address}/")).unwrap();
    (client, server)
  }
}
