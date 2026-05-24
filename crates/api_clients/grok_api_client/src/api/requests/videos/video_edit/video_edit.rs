use log::info;
use serde_derive::Serialize;

use crate::api::requests::videos::video_edit::request_types::*;
use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::api::types::video_types::video_model::VideoModel;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;

// ── Public args ──

/// Top-level argument to [`video_edit`]. Borrows the API key separately from
/// the request body so callers can log/save [`VideoEditRequest`] without
/// leaking the credential.
#[derive(Clone, Debug)]
pub struct VideoEditArgs<'a> {
  pub api_key: &'a GrokApiKey,
  pub request: VideoEditRequest,
}

/// The material part of a video-edit request. Derives [`Serialize`] so it
/// can be persisted to a log or audit store independently of the API key.
#[derive(Clone, Debug, Serialize)]
pub struct VideoEditRequest {
  /// Edit instruction. Required.
  pub prompt: String,

  /// Source video to modify (xAI reads this as the input).
  pub source_video: VideoSource,

  /// Model identifier. Defaults to [`VideoModel::GrokImagineVideo`] when `None`.
  /// Use [`VideoModel::Custom`] for identifiers not yet listed in the enum.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<VideoModel>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub user: Option<String>,
}

/// Source video to edit. Pick by public URL or by a previously-uploaded
/// xAI file_id.
#[derive(Clone, Debug, Serialize)]
pub enum VideoSource {
  /// Public HTTPS URL pointing to the source video. xAI fetches the bytes
  /// on its end.
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
pub async fn video_edit(args: VideoEditArgs<'_>) -> Result<VideoEditSuccess, GrokError> {
  let req = args.request;

  let url = format!("{}/v1/videos/edits", XAI_API_BASE_URL);
  let model = req.model.unwrap_or(VideoModel::GrokImagineVideo);

  info!("Grok video_edit: model={}", model.as_str());

  let request_body = VideoEditRequestBody {
    prompt: req.prompt,
    video: to_video_source_ref(&req.source_video),
    model: Some(model.as_str().to_string()),
    user: req.user,
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

  // ── Wire-format shape tests ──

  #[test]
  fn wire_body_serializes_url_source() {
    let body = VideoEditRequestBody {
      prompt: "make it stormy".to_string(),
      video: VideoSourceRef { url: Some("https://example.com/v.mp4".to_string()), file_id: None },
      model: Some("grok-imagine-video".to_string()),
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"prompt\":\"make it stormy\""));
    assert!(json.contains("\"video\":{\"url\":\"https://example.com/v.mp4\"}"));
    assert!(json.contains("\"model\":\"grok-imagine-video\""));
    assert!(!json.contains("\"file_id\""));
  }

  #[test]
  fn wire_body_serializes_file_id_source() {
    let body = VideoEditRequestBody {
      prompt: "p".to_string(),
      video: VideoSourceRef { url: None, file_id: Some("file_v".to_string()) },
      model: None,
      user: Some("u".to_string()),
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"video\":{\"file_id\":\"file_v\"}"));
    assert!(json.contains("\"user\":\"u\""));
  }

  // ── Public Request shape ──

  #[test]
  fn request_serializes_without_api_key() {
    let key = GrokApiKey::new("secret_must_not_leak".to_string());
    let args = VideoEditArgs {
      api_key: &key,
      request: VideoEditRequest {
        prompt: "p".to_string(),
        source_video: VideoSource::FileId("file_abc".to_string()),
        model: None,
        user: None,
      },
    };
    let json = serde_json::to_string(&args.request).unwrap();
    assert!(!json.contains("secret_must_not_leak"));
    assert!(json.contains("\"source_video\":{\"FileId\":\"file_abc\"}"));
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
    use test_data::web::video_urls::ANGRY_SHIBA_VIDEO_URL;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = video_edit(VideoEditArgs {
      api_key: &api_key,
      request: VideoEditRequest {
        prompt: "Change the lighting to midnight. Starry sky with the mily way overhead. Add some shooting stars. Everything is glowing under the starlight.".to_string(),
        source_video: VideoSource::Url(ANGRY_SHIBA_VIDEO_URL.to_string()),
        model: None,
        user: None,
      },
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Edit request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }
}
