use log::info;
use serde_derive::Serialize;

use crate::api::requests::videos::video_generation::request_types::*;
use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::error::grok_specific_api_error::GrokSpecificApiError;

const DEFAULT_MODEL: &str = "grok-imagine-video";

// ── Public args ──

/// Top-level argument to [`video_generation`]. Borrows the API key separately
/// from the request body so callers can log/save [`VideoGenerationRequest`]
/// without leaking the credential.
#[derive(Clone, Debug)]
pub struct VideoGenerationArgs<'a> {
  pub api_key: &'a GrokApiKey,
  pub request: VideoGenerationRequest,
}

/// The material part of a video-generation request. Derives [`Serialize`] so
/// it can be persisted to a log or audit store independently of the API key.
#[derive(Clone, Debug, Serialize)]
pub struct VideoGenerationRequest {
  /// Text prompt. Required.
  pub prompt: String,

  /// Model identifier. Defaults to `grok-imagine-video`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,

  /// Image-to-video: a single source image. Mutually exclusive with
  /// `reference_images` — supplying both returns a `BadRequest` before the
  /// HTTP call.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image: Option<VideoImageSource>,

  /// Reference-to-video: zero or more reference images.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_images: Option<Vec<VideoImageSource>>,

  /// e.g. "16:9", "1:1", "9:16".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds (1–15). xAI default is 8.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u32>,

  /// `"480p"`, `"720p"`, `"1080p"`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Optional presigned PUT URL where xAI should upload the rendered video.
  /// Per the REST API reference this is required; per the published curl
  /// examples it's optional. Omit unless your account requires it.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub upload_url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub user: Option<String>,
}

/// Source image for `image` (image-to-video) or `reference_images`
/// (reference-to-video).
#[derive(Clone, Debug, Serialize)]
pub enum VideoImageSource {
  /// Either a public HTTPS URL or a `data:` URI containing base64-encoded
  /// image bytes.
  Url(String),

  /// xAI file identifier (`file_...`) obtained from a successful upload via
  /// [`crate::api::requests::files::upload_file::upload_file::upload_file`]. The file
  /// must still exist at request time.
  ///
  /// Docs:
  /// - <https://docs.x.ai/developers/rest-api-reference/files/upload>
  /// - <https://docs.x.ai/developers/rest-api-reference/files/manage>
  FileId(String),
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct VideoGenerationSuccess {
  /// Use this with `video_status::video_status` to poll for completion.
  pub request_id: String,
}

// ── Implementation ──

/// POST https://api.x.ai/v1/videos/generations — start a video generation
/// job. The video is rendered asynchronously; poll
/// `video_status::video_status(request_id)` until it returns `done` or
/// `failed`.
///
/// Docs:
/// - <https://docs.x.ai/developers/model-capabilities/video/generation>
/// - <https://docs.x.ai/developers/model-capabilities/video/image-to-video>
/// - <https://docs.x.ai/developers/model-capabilities/video/reference-to-video>
pub async fn video_generation(args: VideoGenerationArgs<'_>) -> Result<VideoGenerationSuccess, GrokError> {
  let req = args.request;

  if req.image.is_some() && req.reference_images.as_ref().is_some_and(|v| !v.is_empty()) {
    return Err(GrokSpecificApiError::BadRequest(
      "video_generation cannot combine `image` (image-to-video) with `reference_images` (reference-to-video) in the same request".to_string(),
    ).into());
  }

  let url = format!("{}/v1/videos/generations", XAI_API_BASE_URL);
  let model = req.model.unwrap_or_else(|| DEFAULT_MODEL.to_string());

  info!(
    "Grok video_generation: model={}, has_image={}, ref_imgs={}, aspect_ratio={:?}, duration={:?}, resolution={:?}",
    model,
    req.image.is_some(),
    req.reference_images.as_ref().map(|v| v.len()).unwrap_or(0),
    req.aspect_ratio,
    req.duration,
    req.resolution,
  );

  let request_body = VideoGenerationRequestBody {
    prompt: req.prompt,
    model: Some(model),
    image: req.image.as_ref().map(to_video_image_ref),
    reference_images: req.reference_images.map(|v| v.iter().map(to_video_image_ref).collect()),
    aspect_ratio: req.aspect_ratio,
    duration: req.duration,
    resolution: req.resolution,
    output: req.upload_url.map(|upload_url| VideoOutput { upload_url }),
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

  info!("Grok video_generation response: status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: VideoGenerationResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(VideoGenerationSuccess { request_id: parsed.request_id })
}

fn to_video_image_ref(source: &VideoImageSource) -> VideoImageRef {
  match source {
    VideoImageSource::Url(u)    => VideoImageRef { url: Some(u.clone()), file_id: None },
    VideoImageSource::FileId(id) => VideoImageRef { url: None, file_id: Some(id.clone()) },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use errors::AnyhowResult;

  // ── Wire-format shape tests ──

  #[test]
  fn wire_body_serializes_text_only() {
    let body = VideoGenerationRequestBody {
      prompt: "a cat dancing".to_string(),
      model: Some("grok-imagine-video".to_string()),
      image: None,
      reference_images: None,
      aspect_ratio: Some("16:9".to_string()),
      duration: Some(5),
      resolution: Some("720p".to_string()),
      output: None,
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"prompt\":\"a cat dancing\""));
    assert!(json.contains("\"duration\":5"));
    assert!(json.contains("\"resolution\":\"720p\""));
    assert!(!json.contains("\"image\""));
    assert!(!json.contains("\"reference_images\""));
    assert!(!json.contains("\"output\""));
  }

  #[test]
  fn wire_body_serializes_image_to_video() {
    let body = VideoGenerationRequestBody {
      prompt: "animate this".to_string(),
      model: None,
      image: Some(VideoImageRef { url: Some("https://example.com/a.png".to_string()), file_id: None }),
      reference_images: None,
      aspect_ratio: None,
      duration: None,
      resolution: None,
      output: None,
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"image\":{"));
    assert!(json.contains("\"url\":\"https://example.com/a.png\""));
  }

  #[test]
  fn wire_body_serializes_reference_to_video() {
    let body = VideoGenerationRequestBody {
      prompt: "<IMAGE_1> walking".to_string(),
      model: None,
      image: None,
      reference_images: Some(vec![
        VideoImageRef { url: Some("https://example.com/a.png".to_string()), file_id: None },
        VideoImageRef { url: None, file_id: Some("file_xyz".to_string()) },
      ]),
      aspect_ratio: None,
      duration: None,
      resolution: None,
      output: None,
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"reference_images\":["));
    assert!(json.contains("\"file_id\":\"file_xyz\""));
  }

  #[test]
  fn wire_body_serializes_upload_url() {
    let body = VideoGenerationRequestBody {
      prompt: "p".to_string(),
      model: None,
      image: None,
      reference_images: None,
      aspect_ratio: None,
      duration: None,
      resolution: None,
      output: Some(VideoOutput { upload_url: "https://r2.example.com/put".to_string() }),
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"output\":{\"upload_url\":\"https://r2.example.com/put\"}"));
  }

  // ── Public Request shape ──

  #[test]
  fn request_serializes_without_api_key() {
    let key = GrokApiKey::new("secret_must_not_leak".to_string());
    let args = VideoGenerationArgs {
      api_key: &key,
      request: VideoGenerationRequest {
        prompt: "p".to_string(),
        model: None,
        image: Some(VideoImageSource::Url("u".to_string())),
        reference_images: None,
        aspect_ratio: Some("16:9".to_string()),
        duration: Some(8),
        resolution: Some("720p".to_string()),
        upload_url: None,
        user: None,
      },
    };
    let json = serde_json::to_string(&args.request).unwrap();
    assert!(!json.contains("secret_must_not_leak"),
      "serialized request must not contain the API key. got: {}", json);
    assert!(json.contains("\"prompt\":\"p\""));
    assert!(json.contains("\"image\":{\"Url\":\"u\"}"));
    assert!(json.contains("\"aspect_ratio\":\"16:9\""));
  }

  #[tokio::test]
  async fn image_plus_reference_images_returns_bad_request() {
    let api_key = GrokApiKey::new("dummy".to_string());
    let result = video_generation(VideoGenerationArgs {
      api_key: &api_key,
      request: VideoGenerationRequest {
        prompt: "x".to_string(),
        model: None,
        image: Some(VideoImageSource::Url("u".to_string())),
        reference_images: Some(vec![VideoImageSource::Url("v".to_string())]),
        aspect_ratio: None,
        duration: None,
        resolution: None,
        upload_url: None,
        user: None,
      },
    }).await;
    let err = result.unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::BadRequest(_))));
  }

  #[test]
  fn response_body_deserializes() {
    let json = r#"{ "request_id": "d97415a1-5796-b7ec-379f-4e6819e08fdf" }"#;
    let parsed: VideoGenerationResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.request_id, "d97415a1-5796-b7ec-379f-4e6819e08fdf");
  }

  // ── Live API tests ──

  #[tokio::test]
  #[ignore] // manually test — requires real API key and incurs costs
  async fn live_test_video_generation_text_only() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = video_generation(VideoGenerationArgs {
      api_key: &api_key,
      request: VideoGenerationRequest {
        prompt: "A glowing crystal rocket launching from Mars".to_string(),
        model: None,
        image: None,
        reference_images: None,
        aspect_ratio: Some("16:9".to_string()),
        duration: Some(5),
        resolution: Some("480p".to_string()),
        upload_url: None,
        user: None,
      },
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Video request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }
}
