use log::info;

use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::video_extension::request_types::*;
use crate::requests::xai_host::XAI_API_BASE_URL;

const DEFAULT_MODEL: &str = "grok-imagine-video";

// ── Public args ──

#[derive(Clone, Debug)]
pub struct VideoExtensionArgs {
  pub api_key: GrokApiKey,

  /// Prompt describing what should happen in the extension.
  pub prompt: String,

  /// Source video to extend.
  pub source_video: VideoExtensionSource,

  /// Model identifier. Defaults to `grok-imagine-video`.
  pub model: Option<String>,

  /// Length of the *extension only*, not the total output. xAI default is 6
  /// seconds; range 1–10.
  pub duration: Option<u32>,

  /// Optional presigned PUT URL.
  pub upload_url: Option<String>,
}

#[derive(Clone, Debug)]
pub enum VideoExtensionSource {
  Url(String),
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
pub async fn video_extension(args: VideoExtensionArgs) -> Result<VideoExtensionSuccess, GrokError> {
  let url = format!("{}/v1/videos/extensions", XAI_API_BASE_URL);
  let model = args.model.unwrap_or_else(|| DEFAULT_MODEL.to_string());

  info!("Grok video_extension: model={}, duration={:?}", model, args.duration);

  let request_body = VideoExtensionRequestBody {
    prompt: args.prompt,
    video: to_extension_source_ref(&args.source_video),
    model: Some(model),
    duration: args.duration,
    output: args.upload_url.map(|upload_url| VideoExtensionOutput { upload_url }),
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

  // ── Shape tests ──

  #[test]
  fn body_serializes_minimal() {
    let body = VideoExtensionRequestBody {
      prompt: "keep walking".to_string(),
      video: VideoExtensionSourceRef { url: Some("https://example.com/v.mp4".to_string()), file_id: None },
      model: Some("grok-imagine-video".to_string()),
      duration: None,
      output: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"prompt\":\"keep walking\""));
    assert!(json.contains("\"video\":{\"url\":\"https://example.com/v.mp4\"}"));
    assert!(json.contains("\"model\":\"grok-imagine-video\""));
    assert!(!json.contains("\"duration\""));
    assert!(!json.contains("\"output\""));
  }

  #[test]
  fn body_serializes_with_duration_and_upload_url() {
    let body = VideoExtensionRequestBody {
      prompt: "p".to_string(),
      video: VideoExtensionSourceRef { url: None, file_id: Some("file_v".to_string()) },
      model: None,
      duration: Some(8),
      output: Some(VideoExtensionOutput { upload_url: "https://r2.example.com/put".to_string() }),
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"duration\":8"));
    assert!(json.contains("\"video\":{\"file_id\":\"file_v\"}"));
    assert!(json.contains("\"output\":{\"upload_url\":\"https://r2.example.com/put\"}"));
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
    setup_test_logging();

    let api_key = get_test_api_key()?;
    // Replace with a real publicly-reachable mp4 URL when running.
    let result = video_extension(VideoExtensionArgs {
      api_key,
      prompt: "Continue the walk down the same street".to_string(),
      source_video: VideoExtensionSource::Url(
        "https://docs.x.ai/assets/api-examples/videos/extension-source.mp4".to_string()
      ),
      model: None,
      duration: Some(5),
      upload_url: None,
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Extension request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }
}
