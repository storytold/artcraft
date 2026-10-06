use crate::creds::mediakit_api_key::MediaKitApiKey;
use crate::error::ark_api_error::{ArkApiError, ArkApiErrorKind};
use crate::error::ark_error::ArkError;
use log::{debug, info};
use reqwest::{Client, Method, StatusCode};
use serde::de::DeserializeOwned;
use serde_derive::{Deserialize, Serialize};
use std::time::Duration;

/// AI MediaKit has its own host and key; it isn't part of ModelArk.
pub const MEDIAKIT_BASE_URL: &str = "https://mediakit.ap-southeast-1.bytepluses.com";

/// Price of one output minute at coefficient 1, in US dollars.
pub const BASE_USD_PER_OUTPUT_MINUTE: f64 = 0.2066;

/// MediaKit takes input up to 10 GB.
pub const MAX_INPUT_BYTES: u64 = 10 * 1024 * 1024 * 1024;

const SUBMIT_TIMEOUT: Duration = Duration::from_secs(60);
const GET_TASK_TIMEOUT: Duration = Duration::from_secs(30);

/// Output frame rate bands of the price table: up to 30, 60 and 120 fps.
const FPS_BAND_CAPS: [f64; 3] = [30.0, 60.0, 120.0];

/// Standard-tier coefficients per output resolution and fps band. Professional is ten times this.
const STANDARD_COEFFICIENTS: [(EnhanceResolution, [u32; 3]); 5] = [
  (EnhanceResolution::P720, [1, 2, 4]),
  (EnhanceResolution::P1080, [2, 4, 8]),
  (EnhanceResolution::TwoK, [4, 8, 16]),
  (EnhanceResolution::FourK, [8, 16, 32]),
  (EnhanceResolution::EightK, [32, 64, 128]),
];

const PROFESSIONAL_MULTIPLIER: u32 = 10;

/// `POST /api/v1/tools/enhance-video`
#[derive(Clone, Debug, Serialize)]
pub struct EnhanceVideoRequest {
  /// A public http(s) link MediaKit can download (mp4, mov, mkv...; up to 2K input).
  pub video_url: String,

  pub tool_version: EnhanceTier,

  pub enhance_style: EnhanceStyle,

  pub resolution: EnhanceResolution,

  /// The preset the enhancement is tuned for (both tiers).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub scene: Option<EnhanceScene>,

  /// Professional only: 8, 10, 12 or 16 (MP4 output keeps at most 10 bits).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub bit_depth: Option<u8>,

  /// Idempotency token, up to 64 characters.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub client_token: Option<String>,
}

/// A task as `GET /api/v1/tasks/{task_id}` reports it.
#[derive(Clone, Debug, PartialEq)]
pub struct EnhanceTask {
  pub status: EnhanceTaskStatus,

  /// Set once the task completed.
  pub maybe_result: Option<EnhancedVideo>,

  /// MediaKit's reason when the task failed.
  pub maybe_error_message: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EnhanceTaskStatus {
  Running,
  Completed,
  Failed,
}

#[derive(Clone, Debug, PartialEq)]
pub struct EnhancedVideo {
  /// Valid for 24 hours.
  pub video_url: String,
  pub maybe_resolution: Option<String>,
  pub maybe_duration_seconds: Option<f64>,
  pub maybe_fps: Option<f64>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EnhanceTier {
  Standard,
  /// Better detail, ten times the price.
  Professional,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EnhanceStyle {
  /// Sharper, more detail.
  Hd,
  /// Closer to the source look.
  Natural,
}

/// Output resolutions offered for upscaling. MediaKit also accepts 240p to 540p; `resolution` goes
/// up to 4K (8K needs `resolution_limit`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum EnhanceResolution {
  #[serde(rename = "720p")]
  P720,
  #[serde(rename = "1080p")]
  P1080,
  #[serde(rename = "2k")]
  TwoK,
  #[serde(rename = "4k")]
  FourK,
  #[serde(rename = "8k")]
  EightK,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EnhanceScene {
  Common,
  Ugc,
  ShortSeries,
  /// AI-generated video, the common case for upscaling generations.
  Aigc,
  OldFilm,
}

impl EnhanceVideoRequest {
  /// An upscale of AI-generated video in the HD style.
  pub fn upscale(video_url: &str, tier: EnhanceTier, resolution: EnhanceResolution) -> Self {
    Self {
      video_url: video_url.to_string(),
      tool_version: tier,
      enhance_style: EnhanceStyle::Hd,
      resolution,
      scene: Some(EnhanceScene::Aigc),
      bit_depth: None,
      client_token: None,
    }
  }
}

impl EnhanceTask {
  pub fn is_terminal(&self) -> bool {
    self.status != EnhanceTaskStatus::Running
  }
}

/// Starts an enhancement task and returns its id.
pub async fn submit_enhance_video(api_key: &MediaKitApiKey, request: &EnhanceVideoRequest) -> Result<String, ArkError> {
  if !request.video_url.starts_with("https://") && !request.video_url.starts_with("http://") {
    return Err(bad_request("MediaKit needs a public http(s) link to the video.").into());
  }

  info!("MediaKit enhance-video: {:?} {:?} {:?}", request.tool_version, request.resolution, request.enhance_style);

  let url = format!("{}/api/v1/tools/enhance-video", MEDIAKIT_BASE_URL);
  let response: RawTaskResponse = send_mediakit_json(api_key, Method::POST, &url, Some(request), SUBMIT_TIMEOUT).await?;

  response.task_id
      .filter(|task_id| !task_id.is_empty())
      .ok_or_else(|| ArkError::Api(ArkApiError {
        kind: ArkApiErrorKind::Other,
        maybe_status_code: None,
        maybe_code: None,
        maybe_message: Some("MediaKit didn't return a task id.".to_string()),
      }))
}

/// One status check of an enhancement task.
pub async fn get_enhance_task(api_key: &MediaKitApiKey, task_id: &str) -> Result<EnhanceTask, ArkError> {
  let url = format!("{}/api/v1/tasks/{}", MEDIAKIT_BASE_URL, task_id);
  let response: RawTaskResponse = send_mediakit_json::<(), _>(api_key, Method::GET, &url, None, GET_TASK_TIMEOUT).await?;
  Ok(response.into_task())
}

/// Output minutes × coefficient × base price. Billing is per millisecond of output.
pub fn estimate_enhance_cost_usd(
  output_seconds: f64,
  resolution: EnhanceResolution,
  tier: EnhanceTier,
  output_fps: f64,
) -> f64 {
  let band = FPS_BAND_CAPS.iter()
      .position(|cap| output_fps <= *cap)
      .unwrap_or(FPS_BAND_CAPS.len() - 1);
  let standard = STANDARD_COEFFICIENTS.iter()
      .find(|(row, _)| *row == resolution)
      .map(|(_, coefficients)| coefficients[band])
      .unwrap_or(0);
  let coefficient = match tier {
    EnhanceTier::Standard => standard,
    EnhanceTier::Professional => standard * PROFESSIONAL_MULTIPLIER,
  };
  output_seconds.max(0.0) / 60.0 * coefficient as f64 * BASE_USD_PER_OUTPUT_MINUTE
}

/// Sends a request with the MediaKit bearer key and parses the JSON answer, turning error
/// statuses and `success: false` bodies into `ArkApiError`s.
async fn send_mediakit_json<Req, Res>(
  api_key: &MediaKitApiKey,
  method: Method,
  url: &str,
  maybe_body: Option<&Req>,
  timeout: Duration,
) -> Result<Res, ArkError>
where
  Req: serde::Serialize + ?Sized,
  Res: DeserializeOwned,
{
  let client = Client::builder()
      .timeout(timeout)
      .build()
      .map_err(ArkError::ClientBuild)?;

  let mut request = client.request(method.clone(), url).bearer_auth(&api_key.api_key);
  if let Some(body) = maybe_body {
    request = request.json(body);
  }

  debug!("MediaKit request: {} {}", method, url);

  let response = request.send().await.map_err(ArkError::Network)?;
  let status = response.status();
  let body = response.text().await.map_err(ArkError::Network)?;

  classify_mediakit_response(status, &body)?;

  serde_json::from_str(&body).map_err(|error| ArkError::ResponseParse { error, body })
}

fn classify_mediakit_response(status: StatusCode, body: &str) -> Result<(), ArkApiError> {
  let envelope = serde_json::from_str::<RawTaskResponse>(body).ok();
  let refused = envelope.as_ref().and_then(|envelope| envelope.success) == Some(false);
  if status.is_success() && !refused {
    return Ok(());
  }

  let maybe_error = envelope.and_then(|envelope| envelope.error);
  let maybe_code = maybe_error.as_ref().and_then(|error| error.code.clone());
  let maybe_message = maybe_error.as_ref().and_then(|error| error.describe());

  let kind = match status.as_u16() {
    401 | 403 => ArkApiErrorKind::InvalidApiKey,
    429 => ArkApiErrorKind::RateLimited,
    500..=599 => ArkApiErrorKind::ServerError,
    _ => ArkApiErrorKind::BadRequest,
  };

  Err(ArkApiError {
    kind,
    maybe_status_code: (!status.is_success()).then_some(status.as_u16()),
    maybe_code,
    maybe_message,
  })
}

fn bad_request(message: &str) -> ArkApiError {
  ArkApiError {
    kind: ArkApiErrorKind::BadRequest,
    maybe_status_code: None,
    maybe_code: None,
    maybe_message: Some(message.to_string()),
  }
}

/// Submit and poll share one envelope: `{success, task_id, request_id, status, result, error}`.
#[derive(Deserialize)]
struct RawTaskResponse {
  success: Option<bool>,
  task_id: Option<String>,
  status: Option<String>,
  result: Option<RawResult>,
  error: Option<RawError>,
}

#[derive(Deserialize)]
struct RawResult {
  video_url: Option<String>,
  resolution: Option<String>,
  duration: Option<f64>,
  fps: Option<f64>,
}

#[derive(Deserialize)]
struct RawError {
  code: Option<String>,
  message: Option<String>,
  param: Option<String>,
}

impl RawTaskResponse {
  fn into_task(self) -> EnhanceTask {
    let error_message = self.error.as_ref().and_then(|error| error.message.clone());
    match self.status.as_deref() {
      Some("completed") => match self.result.and_then(RawResult::into_video) {
        Some(video) => EnhanceTask {
          status: EnhanceTaskStatus::Completed,
          maybe_result: Some(video),
          maybe_error_message: None,
        },
        None => EnhanceTask {
          status: EnhanceTaskStatus::Failed,
          maybe_result: None,
          maybe_error_message: Some("MediaKit finished without a video link.".to_string()),
        },
      },
      Some("failed") => EnhanceTask {
        status: EnhanceTaskStatus::Failed,
        maybe_result: None,
        maybe_error_message: error_message,
      },
      // "running", and anything newer, keeps the task waiting.
      _ => EnhanceTask {
        status: EnhanceTaskStatus::Running,
        maybe_result: None,
        maybe_error_message: None,
      },
    }
  }
}

impl RawResult {
  fn into_video(self) -> Option<EnhancedVideo> {
    let video_url = self.video_url.filter(|url| !url.is_empty())?;
    Some(EnhancedVideo {
      video_url,
      maybe_resolution: self.resolution,
      maybe_duration_seconds: self.duration,
      maybe_fps: self.fps,
    })
  }
}

impl RawError {
  fn describe(&self) -> Option<String> {
    let message = self.message.as_deref().filter(|message| !message.is_empty())?;
    Some(match self.param.as_deref().filter(|param| !param.is_empty()) {
      Some(param) => format!("{} (param: {})", message, param),
      None => message.to_string(),
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  mod requests {
    use super::*;

    #[test]
    fn standard_upscale_sends_the_aigc_scene() {
      let request = EnhanceVideoRequest::upscale("https://example.com/a.mp4", EnhanceTier::Standard, EnhanceResolution::FourK);
      assert_eq!(serde_json::to_value(&request).unwrap(), json!({
        "video_url": "https://example.com/a.mp4",
        "tool_version": "standard",
        "enhance_style": "hd",
        "resolution": "4k",
        "scene": "aigc",
      }));
    }

    #[test]
    fn professional_upscale_keeps_the_scene_and_takes_a_bit_depth() {
      let mut request = EnhanceVideoRequest::upscale("https://example.com/a.mp4", EnhanceTier::Professional, EnhanceResolution::P1080);
      request.bit_depth = Some(10);
      let value = serde_json::to_value(&request).unwrap();
      assert_eq!(value["tool_version"], "professional");
      assert_eq!(value["resolution"], "1080p");
      assert_eq!(value["scene"], "aigc");
      assert_eq!(value["bit_depth"], 10);
    }
  }

  mod tasks {
    use super::*;

    #[test]
    fn completed_task_carries_the_video() {
      let task = parse(json!({
        "status": "completed",
        "task_id": "t1",
        "result": { "video_url": "https://cdn.example.com/out.mp4", "resolution": "3840x2160", "duration": 10.04, "fps": 24.0 },
      }));
      assert_eq!(task.status, EnhanceTaskStatus::Completed);
      let video = task.maybe_result.unwrap();
      assert_eq!(video.video_url, "https://cdn.example.com/out.mp4");
      assert_eq!(video.maybe_fps, Some(24.0));
    }

    #[test]
    fn completed_without_a_link_is_a_failure() {
      let task = parse(json!({ "status": "completed", "result": { "video_url": "" } }));
      assert_eq!(task.status, EnhanceTaskStatus::Failed);
      assert!(task.maybe_error_message.unwrap().contains("without a video link"));
    }

    #[test]
    fn failed_and_unknown_statuses() {
      let failed = parse(json!({ "status": "failed", "error": { "code": "InvalidInput", "message": "video too large" } }));
      assert_eq!(failed.status, EnhanceTaskStatus::Failed);
      assert_eq!(failed.maybe_error_message.as_deref(), Some("video too large"));

      assert_eq!(parse(json!({ "status": "queued" })).status, EnhanceTaskStatus::Running);
      assert!(!parse(json!({ "status": "running" })).is_terminal());
    }

    fn parse(value: serde_json::Value) -> EnhanceTask {
      serde_json::from_value::<RawTaskResponse>(value).unwrap().into_task()
    }
  }

  mod errors {
    use super::*;

    #[test]
    fn auth_and_rate_limit_statuses() {
      assert_eq!(classify(403, "{}").kind, ArkApiErrorKind::InvalidApiKey);
      assert_eq!(classify(401, "").kind, ArkApiErrorKind::InvalidApiKey);
      assert_eq!(classify(429, "{}").kind, ArkApiErrorKind::RateLimited);
      assert_eq!(classify(502, "bad gateway").kind, ArkApiErrorKind::ServerError);
    }

    #[test]
    fn rejected_parameters_name_the_field() {
      let body = r#"{"success":false,"error":{"code":"InvalidParameter","message":"resolution is invalid","param":"resolution"}}"#;
      let err = classify(400, body);
      assert_eq!(err.kind, ArkApiErrorKind::BadRequest);
      assert_eq!(err.maybe_code.as_deref(), Some("InvalidParameter"));
      assert_eq!(err.user_message(), "BytePlus rejected the request: resolution is invalid (param: resolution)");
    }

    #[test]
    fn success_false_in_a_2xx_is_an_error() {
      let err = classify(200, r#"{"success":false,"error":{"message":"quota exhausted"}}"#);
      assert_eq!(err.maybe_status_code, None);
      assert_eq!(err.maybe_message.as_deref(), Some("quota exhausted"));
      assert!(classify_mediakit_response(StatusCode::OK, r#"{"success":true,"task_id":"t1"}"#).is_ok());
    }

    fn classify(status: u16, body: &str) -> ArkApiError {
      classify_mediakit_response(StatusCode::from_u16(status).unwrap(), body).unwrap_err()
    }
  }

  // Free: looks up a task id that doesn't exist, to check the key is accepted.
  //   MEDIAKIT_API_KEY=... cargo test -p byteplus_ark_client mediakit_accepts_the_key -- --ignored --nocapture
  #[tokio::test]
  #[ignore]
  async fn mediakit_accepts_the_key() {
    let key = MediaKitApiKey::new(&std::env::var("MEDIAKIT_API_KEY").expect("set MEDIAKIT_API_KEY for live tests"));
    match get_enhance_task(&key, "artcraft-missing-task").await {
      Ok(task) => println!("live mediakit: unexpected task {:?}", task.status),
      Err(ArkError::Api(err)) => {
        println!("live mediakit: status={:?} code={:?} message={:?}", err.maybe_status_code, err.maybe_code, err.maybe_message);
        assert_ne!(err.kind, ArkApiErrorKind::InvalidApiKey, "MediaKit rejected the key");
      }
      Err(err) => panic!("request failed: {:?}", err),
    }
  }

  mod pricing {
    use super::*;

    #[test]
    fn matches_the_published_examples() {
      // A 10 s, 24 fps clip to 4K: $0.28 standard, $2.75 professional.
      let standard = estimate_enhance_cost_usd(10.0, EnhanceResolution::FourK, EnhanceTier::Standard, 24.0);
      let professional = estimate_enhance_cost_usd(10.0, EnhanceResolution::FourK, EnhanceTier::Professional, 24.0);
      assert!((standard - 0.2755).abs() < 0.001, "{}", standard);
      assert!((professional - 2.7547).abs() < 0.001, "{}", professional);
    }

    #[test]
    fn higher_frame_rates_cost_more() {
      let at_24 = estimate_enhance_cost_usd(60.0, EnhanceResolution::P1080, EnhanceTier::Standard, 24.0);
      let at_60 = estimate_enhance_cost_usd(60.0, EnhanceResolution::P1080, EnhanceTier::Standard, 60.0);
      let at_240 = estimate_enhance_cost_usd(60.0, EnhanceResolution::P1080, EnhanceTier::Standard, 240.0);
      assert!((at_24 - 2.0 * BASE_USD_PER_OUTPUT_MINUTE).abs() < 1e-9);
      assert!((at_60 - 4.0 * BASE_USD_PER_OUTPUT_MINUTE).abs() < 1e-9);
      assert!((at_240 - 8.0 * BASE_USD_PER_OUTPUT_MINUTE).abs() < 1e-9);
    }
  }
}
