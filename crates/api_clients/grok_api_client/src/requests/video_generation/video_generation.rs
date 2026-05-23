use log::info;

use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::error::grok_specific_api_error::GrokSpecificApiError;
use crate::requests::video_generation::request_types::*;
use crate::requests::xai_host::XAI_API_BASE_URL;

const DEFAULT_MODEL: &str = "grok-imagine-video";

// ── Public args ──

#[derive(Clone, Debug)]
pub struct VideoGenerationArgs {
  pub api_key: GrokApiKey,

  /// Text prompt. Required.
  pub prompt: String,

  /// Model identifier. Defaults to `grok-imagine-video`.
  pub model: Option<String>,

  /// Image-to-video: a single source image. Mutually exclusive with
  /// `reference_images` — supplying both returns a `BadRequest` before the
  /// HTTP call.
  pub image: Option<VideoImageSource>,

  /// Reference-to-video: zero or more reference images.
  pub reference_images: Option<Vec<VideoImageSource>>,

  /// e.g. "16:9", "1:1", "9:16".
  pub aspect_ratio: Option<String>,

  /// Duration in seconds (1–15). xAI default is 8.
  pub duration: Option<u32>,

  /// `"480p"`, `"720p"`, `"1080p"`.
  pub resolution: Option<String>,

  /// Optional presigned PUT URL where xAI should upload the rendered video.
  /// Per the REST API reference this is required; per the published curl
  /// examples it's optional. Omit unless your account requires it.
  pub upload_url: Option<String>,

  pub user: Option<String>,
}

/// Source image for `image` (image-to-video) or `reference_images`
/// (reference-to-video).
#[derive(Clone, Debug)]
pub enum VideoImageSource {
  /// Either a public HTTPS URL or a `data:` URI containing base64-encoded
  /// image bytes.
  Url(String),

  /// xAI file identifier (`file_...`) obtained from a successful upload via
  /// [`crate::requests::upload_file::upload_file::upload_file`]. The file
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
pub async fn video_generation(args: VideoGenerationArgs) -> Result<VideoGenerationSuccess, GrokError> {
  if args.image.is_some() && args.reference_images.as_ref().is_some_and(|v| !v.is_empty()) {
    return Err(GrokSpecificApiError::BadRequest(
      "video_generation cannot combine `image` (image-to-video) with `reference_images` (reference-to-video) in the same request".to_string(),
    ).into());
  }

  let url = format!("{}/v1/videos/generations", XAI_API_BASE_URL);
  let model = args.model.unwrap_or_else(|| DEFAULT_MODEL.to_string());

  info!(
    "Grok video_generation: model={}, has_image={}, ref_imgs={}, aspect_ratio={:?}, duration={:?}, resolution={:?}",
    model,
    args.image.is_some(),
    args.reference_images.as_ref().map(|v| v.len()).unwrap_or(0),
    args.aspect_ratio,
    args.duration,
    args.resolution,
  );

  let request_body = VideoGenerationRequestBody {
    prompt: args.prompt,
    model: Some(model),
    image: args.image.as_ref().map(to_video_image_ref),
    reference_images: args.reference_images.map(|v| v.iter().map(to_video_image_ref).collect()),
    aspect_ratio: args.aspect_ratio,
    duration: args.duration,
    resolution: args.resolution,
    output: args.upload_url.map(|upload_url| VideoOutput { upload_url }),
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

  // ── Shape tests ──

  #[test]
  fn body_serializes_text_only() {
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
  fn body_serializes_image_to_video() {
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
  fn body_serializes_reference_to_video() {
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
  fn body_serializes_upload_url() {
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

  #[tokio::test]
  async fn image_plus_reference_images_returns_bad_request() {
    let api_key = GrokApiKey::new("dummy".to_string());
    let result = video_generation(VideoGenerationArgs {
      api_key,
      prompt: "x".to_string(),
      model: None,
      image: Some(VideoImageSource::Url("u".to_string())),
      reference_images: Some(vec![VideoImageSource::Url("v".to_string())]),
      aspect_ratio: None,
      duration: None,
      resolution: None,
      upload_url: None,
      user: None,
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
      api_key,
      prompt: "A glowing crystal rocket launching from Mars".to_string(),
      model: None,
      image: None,
      reference_images: None,
      aspect_ratio: Some("16:9".to_string()),
      duration: Some(5),
      resolution: Some("480p".to_string()),
      upload_url: None,
      user: None,
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Video request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }
}
