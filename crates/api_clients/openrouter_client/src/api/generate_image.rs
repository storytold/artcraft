//! `POST /api/v1/images`: generates images, optionally from reference images, and answers once
//! they're done (or failed, unbilled). See https://openrouter.ai/docs/features/multimodal/image-generation

use std::time::Duration;

use base64::Engine;
use base64::engine::general_purpose::STANDARD;
use log::info;
use serde_derive::{Deserialize, Serialize};

use crate::creds::openrouter_api_key::OpenRouterApiKey;
use crate::error::openrouter_error::OpenRouterError;

pub const OPENROUTER_API_BASE: &str = "https://openrouter.ai/api/v1";

/// A process-wide API base (scheme, host and path, no trailing slash) for tests and local
/// development against a stub server; leave unset in production.
pub const ENV_OPENROUTER_CUSTOM_API_BASE: &str = "OPENROUTER_CUSTOM_API_BASE";

/// Image models can take minutes (OpenRouter's own example took 94 s).
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10 * 60);

/// OpenRouter's app attribution headers.
const APP_REFERER: &str = "https://getartcraft.com";
const APP_TITLE: &str = "ArtCraft";

pub struct GenerateImageArgs<'a> {
  pub api_key: &'a OpenRouterApiKey,
  pub request: &'a OpenRouterImageRequest,
  /// Another server; else `ENV_OPENROUTER_CUSTOM_API_BASE`, else `OPENROUTER_API_BASE`.
  pub maybe_api_base: Option<&'a str>,
}

/// The request body. Options a model doesn't list in its `supported_parameters` should be left
/// out rather than sent.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct OpenRouterImageRequest {
  /// The model slug, eg. `google/gemini-3-pro-image`.
  pub model: String,
  pub prompt: String,
  /// How many images (1-10); single-image models reject more than one.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub n: Option<u8>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<OpenRouterResolution>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<OpenRouterAspectRatio>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<OpenRouterQuality>,
  /// Reference images for image-to-image.
  #[serde(default, skip_serializing_if = "Vec::is_empty")]
  pub input_references: Vec<OpenRouterInputReference>,
}

/// The finished images.
#[derive(Clone, Debug)]
pub struct OpenRouterImageResponse {
  pub images: Vec<OpenRouterImage>,
  /// What OpenRouter charged, in US dollars.
  pub maybe_cost_usd: Option<f64>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct OpenRouterImage {
  pub bytes: Vec<u8>,
  /// eg. `image/png`; absent when OpenRouter couldn't tell.
  pub maybe_media_type: Option<String>,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum OpenRouterResolution {
  #[serde(rename = "512")]
  HalfK,
  #[serde(rename = "1K")]
  OneK,
  #[serde(rename = "2K")]
  TwoK,
  #[serde(rename = "4K")]
  FourK,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum OpenRouterAspectRatio {
  #[serde(rename = "auto")]
  Auto,
  #[serde(rename = "1:1")]
  OneByOne,
  #[serde(rename = "3:2")]
  ThreeByTwo,
  #[serde(rename = "4:3")]
  FourByThree,
  #[serde(rename = "5:4")]
  FiveByFour,
  #[serde(rename = "16:9")]
  SixteenByNine,
  #[serde(rename = "21:9")]
  TwentyOneByNine,
  #[serde(rename = "2:3")]
  TwoByThree,
  #[serde(rename = "3:4")]
  ThreeByFour,
  #[serde(rename = "4:5")]
  FourByFive,
  #[serde(rename = "9:16")]
  NineBySixteen,
  #[serde(rename = "9:21")]
  NineByTwentyOne,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OpenRouterQuality {
  Auto,
  Low,
  Medium,
  High,
  #[serde(rename = "xhigh")]
  XHigh,
  Max,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct OpenRouterInputReference {
  #[serde(rename = "type")]
  pub kind: String,
  pub image_url: OpenRouterImageUrl,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct OpenRouterImageUrl {
  /// An HTTP(S) link or a base64 data URL.
  pub url: String,
}

impl OpenRouterInputReference {
  pub fn from_url(url: impl Into<String>) -> Self {
    Self { kind: "image_url".to_owned(), image_url: OpenRouterImageUrl { url: url.into() } }
  }
}

impl OpenRouterImage {
  /// The file extension for the image's type (PNG when it isn't known).
  pub fn extension(&self) -> &'static str {
    match self.maybe_media_type.as_deref() {
      Some("image/jpeg" | "image/jpg") => "jpg",
      Some("image/webp") => "webp",
      Some("image/svg+xml") => "svg",
      _ => "png",
    }
  }
}

pub async fn generate_image(args: GenerateImageArgs<'_>) -> Result<OpenRouterImageResponse, OpenRouterError> {
  let url = format!("{}/images", resolve_api_base(args.maybe_api_base));
  info!("OpenRouter image generation: model={} n={:?} references={}", args.request.model, args.request.n, args.request.input_references.len());
  let client = reqwest::Client::builder().timeout(REQUEST_TIMEOUT).build()?;
  let response = client.post(&url)
    .bearer_auth(&args.api_key.api_key)
    .header("HTTP-Referer", APP_REFERER)
    .header("X-Title", APP_TITLE)
    .json(args.request)
    .send()
    .await?;
  let status = response.status();
  let body = response.text().await?;
  if !status.is_success() {
    return Err(OpenRouterError::from_status(status.as_u16(), &body));
  }
  decode_response(&body)
}

/// Precedence: the explicit base, then `ENV_OPENROUTER_CUSTOM_API_BASE`, then OpenRouter.
fn resolve_api_base(maybe_api_base: Option<&str>) -> String {
  let from_env = std::env::var(ENV_OPENROUTER_CUSTOM_API_BASE).ok().filter(|v| !v.trim().is_empty());
  maybe_api_base.map(str::to_owned).or(from_env).unwrap_or_else(|| OPENROUTER_API_BASE.to_owned()).trim_end_matches('/').to_owned()
}

/// The success body: `{"data": [{"b64_json": "...", "media_type": "image/png"}], "usage": {"cost": 0.04}}`.
#[derive(Deserialize)]
struct ResponseBody {
  #[serde(default)]
  data: Vec<ResponseImage>,
  usage: Option<ResponseUsage>,
}

#[derive(Deserialize)]
struct ResponseImage {
  b64_json: Option<String>,
  media_type: Option<String>,
}

#[derive(Deserialize)]
struct ResponseUsage {
  cost: Option<f64>,
}

fn decode_response(body: &str) -> Result<OpenRouterImageResponse, OpenRouterError> {
  let parsed: ResponseBody = serde_json::from_str(body).map_err(|err| OpenRouterError::BadResponse(err.to_string()))?;
  let images = parsed.data.into_iter()
    .filter_map(|image| image.b64_json.map(|b64| (b64, image.media_type)))
    .map(|(b64, maybe_media_type)| {
      STANDARD.decode(b64.trim())
        .map(|bytes| OpenRouterImage { bytes, maybe_media_type })
        .map_err(|err| OpenRouterError::BadResponse(format!("image wasn't valid base64: {err}")))
    })
    .collect::<Result<Vec<_>, _>>()?;
  if images.is_empty() {
    return Err(OpenRouterError::BadResponse("no images in the response".to_owned()));
  }
  Ok(OpenRouterImageResponse { images, maybe_cost_usd: parsed.usage.and_then(|u| u.cost) })
}

#[cfg(test)]
mod tests {
  use std::sync::{Arc, Mutex};

  use serde_json::json;
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;

  use super::*;

  #[test]
  fn requests_leave_out_unset_options() {
    let request = OpenRouterImageRequest { model: "google/gemini-3-pro-image".into(), prompt: "a fox".into(), n: None, resolution: None, aspect_ratio: None, quality: None, input_references: Vec::new() };
    assert_eq!(serde_json::to_value(&request).unwrap(), json!({ "model": "google/gemini-3-pro-image", "prompt": "a fox" }));
    let full = OpenRouterImageRequest { n: Some(2), resolution: Some(OpenRouterResolution::TwoK), aspect_ratio: Some(OpenRouterAspectRatio::SixteenByNine), quality: Some(OpenRouterQuality::XHigh), input_references: vec![OpenRouterInputReference::from_url("https://cdn/x.png")], ..request };
    assert_eq!(serde_json::to_value(&full).unwrap(), json!({
      "model": "google/gemini-3-pro-image", "prompt": "a fox", "n": 2, "resolution": "2K", "aspect_ratio": "16:9", "quality": "xhigh",
      "input_references": [{ "type": "image_url", "image_url": { "url": "https://cdn/x.png" } }],
    }));
    let back: OpenRouterImageRequest = serde_json::from_value(serde_json::to_value(&full).unwrap()).unwrap();
    assert_eq!(back, full, "jobs save their request, so it must round-trip");
  }

  #[test]
  fn responses_decode_their_images() {
    let body = json!({ "data": [{ "b64_json": STANDARD.encode(b"png-bytes"), "media_type": "image/png" }, { "b64_json": STANDARD.encode(b"jpeg-bytes"), "media_type": "image/jpeg" }], "usage": { "cost": 0.04 } }).to_string();
    let response = decode_response(&body).unwrap();
    assert_eq!(response.images.len(), 2);
    assert_eq!((response.images[0].bytes.as_slice(), response.images[0].extension()), (b"png-bytes".as_slice(), "png"));
    assert_eq!(response.images[1].extension(), "jpg");
    assert_eq!(response.maybe_cost_usd, Some(0.04));
    assert!(matches!(decode_response(r#"{"data":[]}"#), Err(OpenRouterError::BadResponse(_))));
    assert!(matches!(decode_response(r#"{"data":[{"b64_json":"%%%"}]}"#), Err(OpenRouterError::BadResponse(_))));
  }

  #[test]
  fn the_explicit_api_base_wins() {
    assert_eq!(resolve_api_base(Some("http://127.0.0.1:9/v1/")), "http://127.0.0.1:9/v1");
  }

  #[tokio::test]
  async fn generate_image_talks_to_the_api() {
    let png = STANDARD.encode(b"\x89PNG-fake");
    let (base, seen) = serve_once("200 OK", json!({ "data": [{ "b64_json": png, "media_type": "image/png" }], "usage": { "cost": 0.03 } }).to_string()).await;
    let request = OpenRouterImageRequest { model: "bytedance-seed/seedream-4.5".into(), prompt: "a fox".into(), n: Some(1), resolution: None, aspect_ratio: Some(OpenRouterAspectRatio::OneByOne), quality: None, input_references: Vec::new() };
    let key = OpenRouterApiKey::from_str("sk-or-test");
    let response = generate_image(GenerateImageArgs { api_key: &key, request: &request, maybe_api_base: Some(&base) }).await.unwrap();
    assert_eq!(response.images[0].bytes, b"\x89PNG-fake");
    let raw = seen.lock().unwrap().clone();
    assert!(raw.starts_with("POST /images "), "{raw}");
    assert!(raw.to_ascii_lowercase().contains("authorization: bearer sk-or-test"));
    assert!(raw.contains(r#""aspect_ratio":"1:1""#));
  }

  #[tokio::test]
  async fn generate_image_reports_billing_errors() {
    let (base, _) = serve_once("402 Payment Required", r#"{"error":{"code":402,"message":"Insufficient credits"}}"#.to_owned()).await;
    let request = OpenRouterImageRequest { model: "m".into(), prompt: "p".into(), n: None, resolution: None, aspect_ratio: None, quality: None, input_references: Vec::new() };
    let key = OpenRouterApiKey::from_str("sk-or-test");
    let err = generate_image(GenerateImageArgs { api_key: &key, request: &request, maybe_api_base: Some(&base) }).await.unwrap_err();
    assert!(err.is_billing_error(), "{err}");
  }

  #[tokio::test]
  #[ignore] // calls the live API (free: a bad key is refused before anything runs)
  async fn live_api_refuses_a_bad_key() {
    let request = OpenRouterImageRequest { model: "google/gemini-3-pro-image".into(), prompt: "a fox".into(), n: None, resolution: None, aspect_ratio: None, quality: None, input_references: Vec::new() };
    let key = OpenRouterApiKey::from_str("sk-or-v1-invalid-key-for-artcraft-tests");
    let err = generate_image(GenerateImageArgs { api_key: &key, request: &request, maybe_api_base: Some(OPENROUTER_API_BASE) }).await.unwrap_err();
    assert!(matches!(err, OpenRouterError::InvalidApiKey(_)), "{err}");
  }

  /// A one-request HTTP server answering `status` with `body`; also returns the raw request.
  async fn serve_once(status: &'static str, body: String) -> (String, Arc<Mutex<String>>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    let seen = Arc::new(Mutex::new(String::new()));
    let seen_by_server = seen.clone();
    tokio::spawn(async move {
      let (mut socket, _) = listener.accept().await.unwrap();
      let mut raw = Vec::new();
      let mut buf = [0u8; 4096];
      loop {
        let n = socket.read(&mut buf).await.unwrap();
        raw.extend_from_slice(&buf[..n]);
        let text = String::from_utf8_lossy(&raw).to_string();
        if let Some(end) = text.find("\r\n\r\n") {
          let length = text.lines().find_map(|l| l.to_ascii_lowercase().strip_prefix("content-length:").map(|v| v.trim().parse::<usize>().unwrap())).unwrap_or(0);
          if raw.len() >= end + 4 + length || n == 0 {
            break;
          }
        }
      }
      *seen_by_server.lock().unwrap() = String::from_utf8_lossy(&raw).to_string();
      let reply = format!("HTTP/1.1 {status}\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}", body.len());
      socket.write_all(reply.as_bytes()).await.unwrap();
    });
    (base, seen)
  }
}
