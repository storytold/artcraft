use log::info;

use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::video_edit::request_types::*;
use crate::requests::xai_host::XAI_API_BASE_URL;

const DEFAULT_MODEL: &str = "grok-imagine-video";

// ── Public args ──

#[derive(Clone, Debug)]
pub struct VideoEditArgs {
  pub api_key: GrokApiKey,

  /// Edit instruction. Required.
  pub prompt: String,

  /// Source video to modify.
  pub source_video: VideoSource,

  /// Model identifier. Defaults to `grok-imagine-video`.
  pub model: Option<String>,

  /// Optional presigned PUT URL. See `video_generation` for the
  /// docs-vs-REST-spec discrepancy.
  pub upload_url: Option<String>,

  pub user: Option<String>,
}

/// Source video to edit. Pick by public URL or by a previously-uploaded
/// xAI file_id.
#[derive(Clone, Debug)]
pub enum VideoSource {
  /// Public HTTPS URL pointing to the source video. xAI fetches the bytes
  /// on its end.
  Url(String),

  /// xAI file identifier (`file_...`) obtained from a successful upload via
  /// [`crate::requests::upload_file::upload_file::upload_file`].
  ///
  /// Docs:
  /// - <https://docs.x.ai/developers/rest-api-reference/files/upload>
  /// - <https://docs.x.ai/developers/rest-api-reference/files/manage>
  FileId(String),
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct VideoEditSuccess {
  /// Use this with `video_status` to poll for completion.
  pub request_id: String,
}

// ── Implementation ──

/// POST https://api.x.ai/v1/videos/edits — modify an existing video based on
/// a text prompt. Asynchronous; poll `video_status` for completion.
///
/// xAI states the `duration`, `aspectRatio`, and `resolution` parameters are
/// ignored for video edits — the output mirrors the source video.
///
/// Docs: <https://docs.x.ai/developers/model-capabilities/video/editing>
pub async fn video_edit(args: VideoEditArgs) -> Result<VideoEditSuccess, GrokError> {
  let url = format!("{}/v1/videos/edits", XAI_API_BASE_URL);
  let model = args.model.unwrap_or_else(|| DEFAULT_MODEL.to_string());

  info!("Grok video_edit: model={}", model);

  let request_body = VideoEditRequestBody {
    prompt: args.prompt,
    video: to_video_source_ref(&args.source_video),
    model: Some(model),
    output: args.upload_url.map(|upload_url| VideoEditOutput { upload_url }),
    user: args.user,
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

  info!("Grok video_edit response: status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: VideoEditResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(VideoEditSuccess { request_id: parsed.request_id })
}

fn to_video_source_ref(source: &VideoSource) -> VideoSourceRef {
  match source {
    VideoSource::Url(u)    => VideoSourceRef { url: Some(u.clone()), file_id: None },
    VideoSource::FileId(id) => VideoSourceRef { url: None, file_id: Some(id.clone()) },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use errors::AnyhowResult;

  // ── Shape tests ──

  #[test]
  fn body_serializes_url_source() {
    let body = VideoEditRequestBody {
      prompt: "make it stormy".to_string(),
      video: VideoSourceRef { url: Some("https://example.com/v.mp4".to_string()), file_id: None },
      model: Some("grok-imagine-video".to_string()),
      output: None,
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"prompt\":\"make it stormy\""));
    assert!(json.contains("\"video\":{\"url\":\"https://example.com/v.mp4\"}"));
    assert!(json.contains("\"model\":\"grok-imagine-video\""));
    assert!(!json.contains("\"output\""));
    assert!(!json.contains("\"file_id\""));
  }

  #[test]
  fn body_serializes_file_id_source_with_upload_url() {
    let body = VideoEditRequestBody {
      prompt: "p".to_string(),
      video: VideoSourceRef { url: None, file_id: Some("file_v".to_string()) },
      model: None,
      output: Some(VideoEditOutput { upload_url: "https://r2.example.com/put".to_string() }),
      user: Some("u".to_string()),
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"video\":{\"file_id\":\"file_v\"}"));
    assert!(json.contains("\"output\":{\"upload_url\":\"https://r2.example.com/put\"}"));
    assert!(json.contains("\"user\":\"u\""));
  }

  #[test]
  fn response_body_deserializes() {
    let json = r#"{ "request_id": "0199c33d-3afa-7000-b400-deadbeefcafe" }"#;
    let parsed: VideoEditResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.request_id, "0199c33d-3afa-7000-b400-deadbeefcafe");
  }

  // ── Live API tests ──

  #[tokio::test]
  #[ignore] // manually test — requires real API key and incurs costs
  async fn live_test_video_edit() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    // Replace with a real publicly-reachable mp4 URL when running.
    let result = video_edit(VideoEditArgs {
      api_key,
      prompt: "Change the lighting to golden hour".to_string(),
      source_video: VideoSource::Url(
        "https://docs.x.ai/assets/api-examples/videos/edit-source.mp4".to_string()
      ),
      model: None,
      upload_url: None,
      user: None,
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Edit request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }
}
