use log::info;
use serde_derive::Serialize;

use crate::api::requests::videos::video_extension::request_types::*;
use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::api::types::video_types::video_model::VideoModel;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;

// ── Public args ──

/// Top-level argument to [`video_extension`]. Borrows the API key separately
/// from the request body so callers can log/save [`VideoExtensionRequest`]
/// without leaking the credential.
#[derive(Clone, Debug)]
pub struct VideoExtensionArgs<'a> {
  pub api_key: &'a GrokApiKey,
  pub request: VideoExtensionRequest,
}

/// The material part of a video-extension request. Derives [`Serialize`] so
/// it can be persisted to a log or audit store independently of the API key.
#[derive(Clone, Debug, Serialize)]
pub struct VideoExtensionRequest {
  /// Prompt describing what should happen in the extension.
  pub prompt: String,

  /// Source video to extend.
  pub source_video: VideoExtensionSource,

  /// Model identifier. Defaults to [`VideoModel::GrokImagineVideo`] when `None`.
  /// Use [`VideoModel::Custom`] for identifiers not yet listed in the enum.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<VideoModel>,

  /// Length of the *extension only*, not the total output. xAI default is 6
  /// seconds; range 1–10.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u32>,
}

/// Source video to extend. Pick by public URL or by a previously-uploaded
/// xAI file_id.
#[derive(Clone, Debug, Serialize)]
pub enum VideoExtensionSource {
  /// Public HTTPS URL pointing to the source video.
  Url(String),

  /// xAI file identifier (`file_...`) obtained from a successful upload via
  /// [`crate::api::requests::files::upload_file::upload_file::upload_file`].
  ///
  /// Docs:
  /// - <https://docs.x.ai/developers/rest-api-reference/files/upload>
  /// - <https://docs.x.ai/developers/rest-api-reference/files/manage>
  FileId(String),
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct VideoExtensionSuccess {
  /// Use this with `video_status` to poll for completion.
  pub request_id: String,
}

// ── Implementation ──

/// POST https://api.x.ai/v1/videos/extensions — extend an existing video with
/// additional generated content.
///
/// Asynchronous; poll `video_status` for completion.
///
/// Docs: <https://docs.x.ai/developers/model-capabilities/video/extension>
pub async fn video_extension(args: VideoExtensionArgs<'_>) -> Result<VideoExtensionSuccess, GrokError> {
  let req = args.request;

  let url = format!("{}/v1/videos/extensions", XAI_API_BASE_URL);
  let model = req.model.unwrap_or(VideoModel::GrokImagineVideo);

  info!("Grok video_extension: model={}, duration={:?}", model.as_str(), req.duration);

  let request_body = VideoExtensionRequestBody {
    prompt: req.prompt,
    video: to_extension_source_ref(&req.source_video),
    model: Some(model.as_str().to_string()),
    duration: req.duration,
  };

  let client = reqwest::Client::builder()
    .build()
    .map_err(GrokClientError::ReqwestClientError)?;

  let bearer = format!("Bearer {}", args.api_key.api_key);

  let response = client.post(&url)
    .header("Authorization", bearer)
    .header("Content-Type", "application/json")
    .json(&request_body)
    .send()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  info!("Grok video_extension response: status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: VideoExtensionResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(VideoExtensionSuccess { request_id: parsed.request_id })
}

fn to_extension_source_ref(source: &VideoExtensionSource) -> VideoExtensionSourceRef {
  match source {
    VideoExtensionSource::Url(u)    => VideoExtensionSourceRef { url: Some(u.clone()), file_id: None },
    VideoExtensionSource::FileId(id) => VideoExtensionSourceRef { url: None, file_id: Some(id.clone()) },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use errors::AnyhowResult;

  // ── Wire-format shape tests ──

  #[test]
  fn wire_body_serializes_minimal() {
    let body = VideoExtensionRequestBody {
      prompt: "keep walking".to_string(),
      video: VideoExtensionSourceRef { url: Some("https://example.com/v.mp4".to_string()), file_id: None },
      model: Some("grok-imagine-video".to_string()),
      duration: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"prompt\":\"keep walking\""));
    assert!(json.contains("\"video\":{\"url\":\"https://example.com/v.mp4\"}"));
    assert!(json.contains("\"model\":\"grok-imagine-video\""));
    assert!(!json.contains("\"duration\""));
  }

  #[test]
  fn wire_body_serializes_with_duration() {
    let body = VideoExtensionRequestBody {
      prompt: "p".to_string(),
      video: VideoExtensionSourceRef { url: None, file_id: Some("file_v".to_string()) },
      model: None,
      duration: Some(8),
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"duration\":8"));
    assert!(json.contains("\"video\":{\"file_id\":\"file_v\"}"));
  }

  // ── Public Request shape ──

  #[test]
  fn request_serializes_without_api_key() {
    let key = GrokApiKey::new("secret_must_not_leak".to_string());
    let args = VideoExtensionArgs {
      api_key: &key,
      request: VideoExtensionRequest {
        prompt: "p".to_string(),
        source_video: VideoExtensionSource::Url("u".to_string()),
        model: None,
        duration: Some(5),
      },
    };
    let json = serde_json::to_string(&args.request).unwrap();
    assert!(!json.contains("secret_must_not_leak"));
    assert!(json.contains("\"duration\":5"));
    assert!(json.contains("\"source_video\":{\"Url\":\"u\"}"));
  }

  #[test]
  fn response_body_deserializes() {
    let json = r#"{ "request_id": "ext-abc-123" }"#;
    let parsed: VideoExtensionResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.request_id, "ext-abc-123");
  }

  // ── Live API tests ──

  #[tokio::test]
  #[ignore] // manually test — requires real API key and incurs costs
  async fn live_test_video_extension() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    use test_data::web::video_urls::ANGRY_SHIBA_VIDEO_URL;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = video_extension(VideoExtensionArgs {
      api_key: &api_key,
      request: VideoExtensionRequest {
        prompt: "Continue the walk down the same street".to_string(),
        source_video: VideoExtensionSource::Url(ANGRY_SHIBA_VIDEO_URL.to_string()),
        model: None,
        duration: Some(5),
      },
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Extension request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }
}
