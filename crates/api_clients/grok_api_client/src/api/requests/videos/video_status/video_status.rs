use log::info;
use serde_derive::Serialize;

use crate::api::requests::videos::video_status::request_types::*;
use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;

// ── Public args ──

/// Top-level argument to [`video_status`]. Borrows the API key separately from
/// the request body so callers can log/save [`VideoStatusRequest`] without
/// leaking the credential.
#[derive(Clone, Debug)]
pub struct VideoStatusArgs<'a> {
  pub api_key: &'a GrokApiKey,
  pub request: VideoStatusRequest,
}

/// The material part of a video-status poll. Derives [`Serialize`] so it
/// can be persisted to a log or audit store independently of the API key.
#[derive(Clone, Debug, Serialize)]
pub struct VideoStatusRequest {
  /// The `request_id` returned by a prior `video_generation`,
  /// `video_edit`, or `video_extension` call.
  pub request_id: String,
}

// ── Public response ──

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VideoStatusState {
  /// Still working.
  Pending,
  /// Finished successfully — `video.url` is populated.
  Done,
  /// xAI couldn't render this — see `VideoJobFailed` in the error path.
  Failed,
}

#[derive(Debug, Clone)]
pub struct VideoStatusSuccess {
  pub state: VideoStatusState,

  /// 0–100, may be `None` while still queued.
  pub progress: Option<u8>,

  /// The model that fulfilled the request.
  pub model: Option<String>,

  /// Populated when `state == Done`.
  pub video: Option<VideoOutputInfo>,

  /// xAI cost reporting (in micro-dollars / "USD ticks").
  pub cost_in_usd_ticks: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct VideoOutputInfo {
  /// Temporary xAI-hosted URL, or the caller-supplied upload URL once xAI has
  /// finished uploading.
  pub url: Option<String>,
  pub duration: Option<u32>,
  pub respect_moderation: Option<bool>,
}

// ── Implementation ──

/// GET https://api.x.ai/v1/videos/{request_id} — poll a video generation /
/// edit / extension job for its current status.
///
/// Returns:
/// - `Ok(VideoStatusSuccess { state: Pending, .. })` while the job is in flight
/// - `Ok(VideoStatusSuccess { state: Done, video: Some(..), .. })` when finished
/// - `Err(GrokSpecificApiError::VideoJobFailed { code, message })` when xAI
///   reports the job as failed
/// - `Err(GrokSpecificApiError::VideoJobExpired)` when the job expired
///
/// Docs: <https://docs.x.ai/developers/model-capabilities/video/generation>
pub async fn video_status(args: VideoStatusArgs<'_>) -> Result<VideoStatusSuccess, GrokError> {
  let req = args.request;
  let url = format!("{}/v1/videos/{}", XAI_API_BASE_URL, req.request_id);

  info!("Grok video_status: request_id={}", req.request_id);

  let client = reqwest::Client::builder()
    .build()
    .map_err(GrokClientError::ReqwestClientError)?;

  let bearer = format!("Bearer {}", args.api_key.api_key);

  let response = client.get(&url)
    .header("Authorization", bearer)
    .send()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  info!("Grok video_status response: http_status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: VideoStatusResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  classify_status_field(&parsed)
}

fn classify_status_field(parsed: &VideoStatusResponseBody) -> Result<VideoStatusSuccess, GrokError> {
  let state = match parsed.status.as_str() {
    "pending" | "queued" | "in_progress" | "processing" => VideoStatusState::Pending,
    "done" | "completed" | "succeeded" => VideoStatusState::Done,
    "failed" => {
      let (code, message) = parsed.error.as_ref()
        .map(|e| (e.code.clone(), e.message.clone()))
        .unwrap_or_else(|| ("unknown".to_string(), "video job failed without details".to_string()));
      return Err(crate::error::grok_specific_api_error::GrokSpecificApiError::VideoJobFailed { code, message }.into());
    }
    "expired" => {
      return Err(crate::error::grok_specific_api_error::GrokSpecificApiError::VideoJobExpired.into());
    }
    other => {
      return Err(GrokGenericApiError::UncategorizedBadResponseWithStatusAndBody {
        status_code: reqwest::StatusCode::OK,
        body: format!("unknown video status: {:?}", other),
      }.into());
    }
  };

  let video = parsed.video.as_ref().map(|v| VideoOutputInfo {
    url: v.url.clone(),
    duration: v.duration,
    respect_moderation: v.respect_moderation,
  });

  Ok(VideoStatusSuccess {
    state,
    progress: parsed.progress,
    model: parsed.model.clone(),
    video,
    cost_in_usd_ticks: parsed.usage.as_ref().and_then(|u| u.cost_in_usd_ticks),
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use errors::AnyhowResult;

  use crate::error::grok_specific_api_error::GrokSpecificApiError;

  // ── Shape tests ──

  #[test]
  fn pending_response_classifies_as_pending() {
    let json = r#"{ "status": "pending", "progress": 12, "model": "grok-imagine-video" }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed).unwrap();
    assert_eq!(result.state, VideoStatusState::Pending);
    assert_eq!(result.progress, Some(12));
    assert_eq!(result.model.as_deref(), Some("grok-imagine-video"));
    assert!(result.video.is_none());
  }

  #[test]
  fn pending_response_with_v1p5_model_passes_model_string_through() {
    // The `model` field is opaque Option<String>; the v1.5 preview model
    // identifier (and its dated alias) flow through unchanged.
    let json = r#"{ "status": "pending", "progress": 5, "model": "grok-imagine-video-1.5-preview" }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed).unwrap();
    assert_eq!(result.model.as_deref(), Some("grok-imagine-video-1.5-preview"));

    let json_alias = r#"{ "status": "pending", "progress": 5, "model": "grok-imagine-video-1.5-2026-05-30" }"#;
    let parsed_alias: VideoStatusResponseBody = serde_json::from_str(json_alias).unwrap();
    let result_alias = classify_status_field(&parsed_alias).unwrap();
    assert_eq!(result_alias.model.as_deref(), Some("grok-imagine-video-1.5-2026-05-30"));
  }

  #[test]
  fn done_response_classifies_as_done_with_video() {
    let json = r#"{
      "status": "done",
      "progress": 100,
      "model": "grok-imagine-video",
      "video": { "url": "https://imagine.x.ai/v.mp4", "duration": 5, "respect_moderation": true },
      "usage": { "cost_in_usd_ticks": 42 }
    }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed).unwrap();
    assert_eq!(result.state, VideoStatusState::Done);
    let video = result.video.unwrap();
    assert_eq!(video.url.as_deref(), Some("https://imagine.x.ai/v.mp4"));
    assert_eq!(video.duration, Some(5));
    assert_eq!(video.respect_moderation, Some(true));
    assert_eq!(result.cost_in_usd_ticks, Some(42));
  }

  #[test]
  fn failed_response_returns_video_job_failed_error() {
    let json = r#"{
      "status": "failed",
      "progress": 50,
      "error": { "code": "invalid_argument", "message": "duration too long" }
    }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let err = classify_status_field(&parsed).unwrap_err();
    match err {
      GrokError::ApiSpecific(GrokSpecificApiError::VideoJobFailed { code, message }) => {
        assert_eq!(code, "invalid_argument");
        assert_eq!(message, "duration too long");
      }
      other => panic!("expected VideoJobFailed, got: {:?}", other),
    }
  }

  #[test]
  fn failed_response_without_error_object_uses_unknown() {
    let json = r#"{ "status": "failed", "progress": 0 }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let err = classify_status_field(&parsed).unwrap_err();
    match err {
      GrokError::ApiSpecific(GrokSpecificApiError::VideoJobFailed { code, .. }) => {
        assert_eq!(code, "unknown");
      }
      other => panic!("expected VideoJobFailed(unknown), got: {:?}", other),
    }
  }

  #[test]
  fn expired_response_returns_expired_error() {
    let json = r#"{ "status": "expired" }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let err = classify_status_field(&parsed).unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::VideoJobExpired)));
  }

  #[test]
  fn unknown_status_field_returns_generic_error() {
    let json = r#"{ "status": "magnificent" }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let err = classify_status_field(&parsed).unwrap_err();
    assert!(matches!(err, GrokError::ApiGeneric(_)));
  }

  // ── Public Request shape ──

  #[test]
  fn request_serializes_without_api_key() {
    let key = GrokApiKey::new("secret_must_not_leak".to_string());
    let args = VideoStatusArgs {
      api_key: &key,
      request: VideoStatusRequest {
        request_id: "req_abc".to_string(),
      },
    };
    let json = serde_json::to_string(&args.request).unwrap();
    assert!(!json.contains("secret_must_not_leak"));
    assert!(json.contains("\"request_id\":\"req_abc\""));
  }

  // ── Live API tests ──

  #[tokio::test]
  #[ignore] // manually test — requires real API key + an existing request_id
  async fn live_test_video_status_unknown_id_is_not_found() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    // Random UUID — should yield 404.
    let result = video_status(VideoStatusArgs {
      api_key: &api_key,
      request: VideoStatusRequest {
        request_id: "00000000-0000-0000-0000-000000000000".to_string(),
      },
    }).await;

    println!("Result: {:?}", result.as_ref().map(|s| (&s.state, s.progress)));
    let err = result.unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::NotFound)),
      "expected NotFound, got: {:?}", err);
    Ok(())
  }

  /// Polls a known request_id and prints the result. Doesn't assert a
  /// specific state — depending on when the test runs, the job may be
  /// pending, done, failed, or expired. The point is to exercise the
  /// happy-path against the real xAI API.
  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn live_test_video_status_known_id() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = video_status(VideoStatusArgs {
      api_key: &api_key,
      request: VideoStatusRequest {
        //request_id: "e397ac83-c22f-90b1-9831-900c01497345".to_string(),
        request_id: "ce681bd0-133d-9cf3-975c-422d292d4e8e".to_string(),
      },
    }).await;

    match &result {
      Ok(s) => println!(
        "status: state={:?} progress={:?} model={:?} video={:?} cost_in_usd_ticks={:?}",
        s.state, s.progress, s.model, s.video, s.cost_in_usd_ticks,
      ),
      Err(e) => println!("status error: {:?}", e),
    }
    // No assertion on the specific state — the job may have completed,
    // failed, or expired by the time this runs. We just want to confirm
    // the request_id was accepted and parsed.
    Ok(())
  }

  /// Polls another known request_id. Same lax assertions as the test above
  /// — state varies with time.
  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn live_test_video_status_known_id_2() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = video_status(VideoStatusArgs {
      api_key: &api_key,
      request: VideoStatusRequest {
        request_id: "7b2fa3dc-8e63-9100-b117-faffb3178773".to_string(),
      },
    }).await;

    match &result {
      Ok(s) => println!(
        "status: state={:?} progress={:?} model={:?} video={:?} cost_in_usd_ticks={:?}",
        s.state, s.progress, s.model, s.video, s.cost_in_usd_ticks,
      ),
      Err(e) => println!("status error: {:?}", e),
    }
    Ok(())
  }

  /// Polls yet another known request_id.
  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn live_test_video_status_known_id_3() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = video_status(VideoStatusArgs {
      api_key: &api_key,
      request: VideoStatusRequest {
        //request_id: "ff94f941-62a7-9966-92da-6b84d9eedb50".to_string(),
        request_id: "4eea215a-9d21-9261-be1a-324409ec22c5".to_string(),
      },
    }).await;

    match &result {
      Ok(s) => println!(
        "status: state={:?} progress={:?} model={:?} video={:?} cost_in_usd_ticks={:?}",
        s.state, s.progress, s.model, s.video, s.cost_in_usd_ticks,
      ),
      Err(e) => println!("status error: {:?}", e),
    }
    Ok(())
  }
}
