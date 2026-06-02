use log::info;
use serde_derive::Serialize;
use serde_json::Value as JsonValue;

use crate::api::requests::videos::video_status::request_types::*;
use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::{body_indicates_moderation, classify_grok_http_error};
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

#[derive(Debug, Clone)]
pub struct VideoStatusResponse {
  pub status: VideoStatus,
}

/// The lifecycle state of a video job. `Failed` is a *status*, not an error —
/// xAI accepted the job and (usually) billed for it, but didn't produce a
/// usable video.
#[derive(Debug, Clone)]
pub enum VideoStatus {
  /// Still working. `progress` is 0–100 when xAI provides it.
  Pending {
    progress: Option<u8>,
  },
  /// Finished successfully — `video.url` is typically populated.
  Complete {
    model: Option<String>,
    video: Option<VideoOutputInfo>,
    cost_in_usd_ticks: Option<u64>,
  },
  /// xAI couldn't render this. `reason` is our best classification; the
  /// remaining fields surface whatever xAI told us so the caller can log,
  /// mark the row failed, and (where applicable) refund / surface a
  /// user-facing message.
  Failed {
    reason: FailureReason,
    code: Option<String>,
    error: Option<String>,
    cost_in_usd_ticks: Option<u64>,
    full_error_json_payload: Option<String>,
  },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FailureReason {
  /// xAI's safety filter rejected the prompt or the generated video.
  ContentModerated,
  /// Anything else: invalid argument we can't recover from, internal error,
  /// expired job, etc.
  Unknown,
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
/// Returns `Ok(VideoStatusResponse)` for any well-formed xAI response,
/// including jobs that failed or were moderated — those come back as
/// `VideoStatus::Failed`. Only infrastructure problems (auth, network, 404
/// for unknown request_id, 5xx) bubble up as `Err(GrokError)`.
///
/// Docs: <https://docs.x.ai/developers/model-capabilities/video/generation>
pub async fn video_status(args: VideoStatusArgs<'_>) -> Result<VideoStatusResponse, GrokError> {
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

  let http_status = response.status();
  let response_body = response.text()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  info!("Grok video_status response: http_status={}", http_status);

  if http_status.is_success() {
    let parsed: VideoStatusResponseBody = serde_json::from_str(&response_body)
      .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;
    return classify_status_field(&parsed, &response_body);
  }

  // Non-2xx. xAI returns 4xx for some failure modes that are really "the job
  // failed" rather than "something is wrong with your request" — most
  // notably content moderation. Recognize those and return them as a Failed
  // status so callers don't have to thread an error path.
  if body_indicates_moderation(&response_body) {
    return Ok(build_moderated_failed_response(&response_body));
  }

  // Anything else (401, 402, 404, 429, plain 400/403, 5xx) is a real error.
  Err(unwrap_classify_err(classify_grok_http_error(http_status, Some(&response_body))))
}

fn classify_status_field(
  parsed: &VideoStatusResponseBody,
  raw_body: &str,
) -> Result<VideoStatusResponse, GrokError> {
  let cost = parsed.usage.as_ref().and_then(|u| u.cost_in_usd_ticks);

  match parsed.status.as_str() {
    "pending" | "queued" | "in_progress" | "processing" => Ok(VideoStatusResponse {
      status: VideoStatus::Pending { progress: parsed.progress },
    }),
    "done" | "completed" | "succeeded" => {
      let video = parsed.video.as_ref().map(|v| VideoOutputInfo {
        url: v.url.clone(),
        duration: v.duration,
        respect_moderation: v.respect_moderation,
      });
      Ok(VideoStatusResponse {
        status: VideoStatus::Complete {
          model: parsed.model.clone(),
          video,
          cost_in_usd_ticks: cost,
        },
      })
    }
    "failed" => {
      let code = parsed.error.as_ref().map(|e| e.code.clone());
      let error_msg = parsed.error.as_ref().map(|e| e.message.clone());
      let reason = if text_indicates_moderation(error_msg.as_deref())
        || body_indicates_moderation(raw_body)
      {
        FailureReason::ContentModerated
      } else {
        FailureReason::Unknown
      };
      Ok(VideoStatusResponse {
        status: VideoStatus::Failed {
          reason,
          code,
          error: error_msg,
          cost_in_usd_ticks: cost,
          full_error_json_payload: Some(raw_body.to_string()),
        },
      })
    }
    "expired" => Ok(VideoStatusResponse {
      status: VideoStatus::Failed {
        reason: FailureReason::Unknown,
        code: Some("expired".to_string()),
        error: Some("video job expired".to_string()),
        cost_in_usd_ticks: cost,
        full_error_json_payload: Some(raw_body.to_string()),
      },
    }),
    other => Err(GrokGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: reqwest::StatusCode::OK,
      body: format!("unknown video status: {:?}", other),
    }.into()),
  }
}

fn build_moderated_failed_response(raw_body: &str) -> VideoStatusResponse {
  let (code, error_msg, cost) = parse_error_body(raw_body);
  VideoStatusResponse {
    status: VideoStatus::Failed {
      reason: FailureReason::ContentModerated,
      code,
      error: error_msg,
      cost_in_usd_ticks: cost,
      full_error_json_payload: Some(raw_body.to_string()),
    },
  }
}

/// Best-effort extraction of `{code, error, usage.cost_in_usd_ticks}` from
/// the two error-body shapes xAI uses:
///
/// 1. Status-poll 4xx:
///    `{"code":"...", "error":"<string>", "usage":{"cost_in_usd_ticks":...}}`
/// 2. OpenAI-compatible:
///    `{"error":{"code":"...", "message":"..."}}`
fn parse_error_body(body: &str) -> (Option<String>, Option<String>, Option<u64>) {
  let parsed: JsonValue = match serde_json::from_str(body) {
    Ok(v) => v,
    Err(_) => return (None, None, None),
  };

  let top_level_code = parsed.get("code")
    .and_then(JsonValue::as_str)
    .map(str::to_string);

  let (error_msg, nested_code) = match parsed.get("error") {
    Some(JsonValue::String(s)) => (Some(s.clone()), None),
    Some(obj @ JsonValue::Object(_)) => {
      let msg = obj.get("message").and_then(JsonValue::as_str).map(str::to_string);
      let nested = obj.get("code").and_then(JsonValue::as_str).map(str::to_string);
      (msg, nested)
    }
    _ => (None, None),
  };

  let code = top_level_code.or(nested_code);

  let cost = parsed.get("usage")
    .and_then(|u| u.get("cost_in_usd_ticks"))
    .and_then(JsonValue::as_u64);

  (code, error_msg, cost)
}

fn text_indicates_moderation(maybe_text: Option<&str>) -> bool {
  maybe_text.map(body_indicates_moderation).unwrap_or(false)
}

/// `classify_grok_http_error` always returns `Err` when the status is non-2xx,
/// so this is infallible in our call path. Spelled out for clarity at the call
/// site rather than `.unwrap_err()` on the inline expression.
fn unwrap_classify_err(result: Result<(), GrokError>) -> GrokError {
  match result {
    Ok(()) => GrokGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: reqwest::StatusCode::OK,
      body: "classify_grok_http_error returned Ok for a non-2xx response".to_string(),
    }.into(),
    Err(err) => err,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use errors::AnyhowResult;

  use crate::error::grok_specific_api_error::GrokSpecificApiError;

  // ── Status-field dispatch (HTTP 200) ──

  #[test]
  fn pending_response_classifies_as_pending() {
    let json = r#"{ "status": "pending", "progress": 12, "model": "grok-imagine-video" }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed, json).unwrap();
    match result.status {
      VideoStatus::Pending { progress } => assert_eq!(progress, Some(12)),
      other => panic!("expected Pending, got: {:?}", other),
    }
  }

  #[test]
  fn pending_response_with_v1p5_model_does_not_break_dispatch() {
    // `model` doesn't surface on Pending; it flows through on Complete only.
    let json = r#"{ "status": "pending", "progress": 5, "model": "grok-imagine-video-1.5-preview" }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed, json).unwrap();
    assert!(matches!(result.status, VideoStatus::Pending { .. }));
  }

  #[test]
  fn done_response_classifies_as_complete_with_video() {
    let json = r#"{
      "status": "done",
      "progress": 100,
      "model": "grok-imagine-video",
      "video": { "url": "https://imagine.x.ai/v.mp4", "duration": 5, "respect_moderation": true },
      "usage": { "cost_in_usd_ticks": 42 }
    }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed, json).unwrap();
    match result.status {
      VideoStatus::Complete { model, video, cost_in_usd_ticks } => {
        assert_eq!(model.as_deref(), Some("grok-imagine-video"));
        let video = video.unwrap();
        assert_eq!(video.url.as_deref(), Some("https://imagine.x.ai/v.mp4"));
        assert_eq!(video.duration, Some(5));
        assert_eq!(video.respect_moderation, Some(true));
        assert_eq!(cost_in_usd_ticks, Some(42));
      }
      other => panic!("expected Complete, got: {:?}", other),
    }
  }

  #[test]
  fn failed_response_returns_ok_failed_unknown() {
    let json = r#"{
      "status": "failed",
      "progress": 50,
      "error": { "code": "invalid_argument", "message": "duration too long" },
      "usage": { "cost_in_usd_ticks": 7 }
    }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed, json).unwrap();
    match result.status {
      VideoStatus::Failed { reason, code, error, cost_in_usd_ticks, full_error_json_payload } => {
        assert_eq!(reason, FailureReason::Unknown);
        assert_eq!(code.as_deref(), Some("invalid_argument"));
        assert_eq!(error.as_deref(), Some("duration too long"));
        assert_eq!(cost_in_usd_ticks, Some(7));
        assert_eq!(full_error_json_payload.as_deref(), Some(json));
      }
      other => panic!("expected Failed, got: {:?}", other),
    }
  }

  #[test]
  fn failed_response_with_moderation_message_is_classified_as_content_moderated() {
    let json = r#"{
      "status": "failed",
      "error": { "code": "permission_denied", "message": "Video rejected by safety moderation" },
      "usage": { "cost_in_usd_ticks": 11 }
    }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed, json).unwrap();
    match result.status {
      VideoStatus::Failed { reason, code, cost_in_usd_ticks, .. } => {
        assert_eq!(reason, FailureReason::ContentModerated);
        assert_eq!(code.as_deref(), Some("permission_denied"));
        assert_eq!(cost_in_usd_ticks, Some(11));
      }
      other => panic!("expected Failed, got: {:?}", other),
    }
  }

  #[test]
  fn failed_response_without_error_object_yields_none_code_and_error() {
    let json = r#"{ "status": "failed", "progress": 0 }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed, json).unwrap();
    match result.status {
      VideoStatus::Failed { reason, code, error, .. } => {
        assert_eq!(reason, FailureReason::Unknown);
        assert!(code.is_none());
        assert!(error.is_none());
      }
      other => panic!("expected Failed, got: {:?}", other),
    }
  }

  #[test]
  fn expired_response_classifies_as_failed_unknown() {
    let json = r#"{ "status": "expired", "usage": { "cost_in_usd_ticks": 3 } }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let result = classify_status_field(&parsed, json).unwrap();
    match result.status {
      VideoStatus::Failed { reason, code, cost_in_usd_ticks, .. } => {
        assert_eq!(reason, FailureReason::Unknown);
        assert_eq!(code.as_deref(), Some("expired"));
        assert_eq!(cost_in_usd_ticks, Some(3));
      }
      other => panic!("expected Failed, got: {:?}", other),
    }
  }

  #[test]
  fn unknown_status_field_returns_generic_error() {
    let json = r#"{ "status": "magnificent" }"#;
    let parsed: VideoStatusResponseBody = serde_json::from_str(json).unwrap();
    let err = classify_status_field(&parsed, json).unwrap_err();
    assert!(matches!(err, GrokError::ApiGeneric(_)));
  }

  // ── Error-body dispatch (HTTP 4xx) ──

  #[test]
  fn moderation_4xx_body_becomes_failed_content_moderated() {
    // The real-world body that previously surfaced as
    // `Err(GrokSpecificApiError::PromptModerated(..))`. It should now be
    // an Ok(Failed { ContentModerated }) with all fields populated from
    // the JSON.
    let body = r#"{"code":"Client specified an invalid argument","error":"Generated video rejected by content moderation.","usage":{"cost_in_usd_ticks":11300000000}}"#;
    let response = build_moderated_failed_response(body);
    match response.status {
      VideoStatus::Failed { reason, code, error, cost_in_usd_ticks, full_error_json_payload } => {
        assert_eq!(reason, FailureReason::ContentModerated);
        assert_eq!(code.as_deref(), Some("Client specified an invalid argument"));
        assert_eq!(error.as_deref(), Some("Generated video rejected by content moderation."));
        assert_eq!(cost_in_usd_ticks, Some(11_300_000_000));
        assert_eq!(full_error_json_payload.as_deref(), Some(body));
      }
      other => panic!("expected Failed, got: {:?}", other),
    }
  }

  #[test]
  fn moderation_openai_shape_body_extracts_nested_code_and_message() {
    let body = r#"{"error":{"code":"content_policy","message":"Content moderation blocked this prompt"}}"#;
    let response = build_moderated_failed_response(body);
    match response.status {
      VideoStatus::Failed { reason, code, error, .. } => {
        assert_eq!(reason, FailureReason::ContentModerated);
        assert_eq!(code.as_deref(), Some("content_policy"));
        assert_eq!(error.as_deref(), Some("Content moderation blocked this prompt"));
      }
      other => panic!("expected Failed, got: {:?}", other),
    }
  }

  #[test]
  fn moderation_unparseable_body_still_yields_failed_with_payload() {
    let body = "totally not json but mentions moderation";
    let response = build_moderated_failed_response(body);
    match response.status {
      VideoStatus::Failed { reason, code, error, full_error_json_payload, .. } => {
        assert_eq!(reason, FailureReason::ContentModerated);
        assert!(code.is_none());
        assert!(error.is_none());
        assert_eq!(full_error_json_payload.as_deref(), Some(body));
      }
      other => panic!("expected Failed, got: {:?}", other),
    }
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

    println!("Result: {:?}", result.as_ref().map(|r| &r.status));
    let err = result.unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::NotFound)),
      "expected NotFound, got: {:?}", err);
    Ok(())
  }

  /// Polls a known request_id and prints the result. Doesn't assert a
  /// specific status — depending on when the test runs, the job may be
  /// pending, complete, or failed. The point is to exercise the
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
        request_id: "ce681bd0-133d-9cf3-975c-422d292d4e8e".to_string(),
      },
    }).await;

    match &result {
      Ok(r) => println!("status: {:?}", r.status),
      Err(e) => println!("status error: {:?}", e),
    }
    Ok(())
  }

  /// Polls another known request_id. Same lax assertions as the test above
  /// — status varies with time.
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
      Ok(r) => println!("status: {:?}", r.status),
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
        request_id: "4d4a6185-209e-95f3-942b-510042637839".to_string(),
      },
    }).await;

    match &result {
      Ok(r) => println!("status: {:?}", r.status),
      Err(e) => println!("status error: {:?}", e),
    }
    Ok(())
  }
}
