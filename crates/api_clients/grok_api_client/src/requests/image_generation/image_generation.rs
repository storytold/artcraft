use log::info;

use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::image_generation::request_types::*;
use crate::requests::xai_host::XAI_API_BASE_URL;

const DEFAULT_MODEL: &str = "grok-imagine-image-quality";

// ── Public args ──

#[derive(Clone, Debug)]
pub struct ImageGenerationArgs {
  pub api_key: GrokApiKey,

  /// Text prompt describing the image. Required.
  pub prompt: String,

  /// Model identifier. Defaults to `grok-imagine-image-quality` if `None`.
  pub model: Option<String>,

  /// Number of images to generate. Server default (typically 1) if `None`.
  pub n: Option<u32>,

  /// Aspect ratio (e.g. "1:1", "16:9", "auto"). Server default if `None`.
  pub aspect_ratio: Option<String>,

  /// Resolution (`"1k"` or `"2k"`). Server default if `None`.
  pub resolution: Option<String>,

  /// `"url"` (default) or `"b64_json"`.
  pub response_format: Option<ImageResponseFormat>,

  /// Optional opaque user identifier for usage attribution.
  pub user: Option<String>,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum ImageResponseFormat {
  Url,
  B64Json,
}

impl ImageResponseFormat {
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::Url => "url",
      Self::B64Json => "b64_json",
    }
  }
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct ImageGenerationSuccess {
  /// One entry per generated image. Order matches the order xAI returned.
  pub images: Vec<GeneratedImage>,
}

#[derive(Debug, Clone)]
pub struct GeneratedImage {
  /// URL to the rendered image. Present when `response_format` was `"url"`
  /// (the default). xAI URLs are time-limited.
  pub url: Option<String>,

  /// Base64-encoded image bytes. Present when `response_format` was `"b64_json"`.
  pub b64_json: Option<String>,

  /// xAI's revised version of the input prompt, if it edited it.
  pub revised_prompt: Option<String>,
}

// ── Implementation ──

/// POST https://api.x.ai/v1/images/generations — generate one or more images
/// from a text prompt using xAI's Imagine API.
///
/// Docs: <https://docs.x.ai/developers/model-capabilities/images/generation>
pub async fn image_generation(args: ImageGenerationArgs) -> Result<ImageGenerationSuccess, GrokError> {
  let url = format!("{}/v1/images/generations", XAI_API_BASE_URL);

  let model = args.model.unwrap_or_else(|| DEFAULT_MODEL.to_string());

  info!(
    "Grok image_generation: model={}, n={:?}, aspect_ratio={:?}, resolution={:?}",
    model, args.n, args.aspect_ratio, args.resolution
  );

  let request_body = ImageGenerationRequestBody {
    prompt: args.prompt,
    model: Some(model),
    n: args.n,
    aspect_ratio: args.aspect_ratio,
    resolution: args.resolution,
    response_format: args.response_format.map(|f| f.as_str().to_string()),
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

  info!("Grok image_generation response: status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: ImageGenerationResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(ImageGenerationSuccess {
    images: parsed.data.into_iter().map(|d| GeneratedImage {
      url: d.url,
      b64_json: d.b64_json,
      revised_prompt: d.revised_prompt,
    }).collect(),
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use errors::AnyhowResult;

  // ── Shape tests (no API calls) ──

  #[test]
  fn request_body_serializes_minimal() {
    let body = ImageGenerationRequestBody {
      prompt: "a cat".to_string(),
      model: Some("grok-imagine-image-quality".to_string()),
      n: None,
      aspect_ratio: None,
      resolution: None,
      response_format: None,
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"prompt\":\"a cat\""));
    assert!(json.contains("\"model\":\"grok-imagine-image-quality\""));
    // Optional fields should be omitted
    assert!(!json.contains("\"n\""));
    assert!(!json.contains("\"aspect_ratio\""));
    assert!(!json.contains("\"user\""));
  }

  #[test]
  fn request_body_serializes_full() {
    let body = ImageGenerationRequestBody {
      prompt: "a cat".to_string(),
      model: Some("grok-imagine-image-quality".to_string()),
      n: Some(2),
      aspect_ratio: Some("16:9".to_string()),
      resolution: Some("2k".to_string()),
      response_format: Some("b64_json".to_string()),
      user: Some("user_abc".to_string()),
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"n\":2"));
    assert!(json.contains("\"aspect_ratio\":\"16:9\""));
    assert!(json.contains("\"resolution\":\"2k\""));
    assert!(json.contains("\"response_format\":\"b64_json\""));
    assert!(json.contains("\"user\":\"user_abc\""));
  }

  #[test]
  fn response_body_deserializes_url() {
    let json = r#"{
      "data": [
        { "url": "https://imagine.x.ai/abc.png", "revised_prompt": "a cat" }
      ]
    }"#;
    let parsed: ImageGenerationResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.data.len(), 1);
    assert_eq!(parsed.data[0].url.as_deref(), Some("https://imagine.x.ai/abc.png"));
    assert!(parsed.data[0].b64_json.is_none());
    assert_eq!(parsed.data[0].revised_prompt.as_deref(), Some("a cat"));
  }

  #[test]
  fn response_body_deserializes_b64_json() {
    let json = r#"{
      "data": [
        { "b64_json": "iVBORw0KGgo=" }
      ]
    }"#;
    let parsed: ImageGenerationResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.data[0].b64_json.as_deref(), Some("iVBORw0KGgo="));
    assert!(parsed.data[0].url.is_none());
  }

  #[test]
  fn response_format_enum_round_trips() {
    assert_eq!(ImageResponseFormat::Url.as_str(), "url");
    assert_eq!(ImageResponseFormat::B64Json.as_str(), "b64_json");
  }

  // ── Live API tests (ignored — incur cost) ──

  #[tokio::test]
  #[ignore] // manually test — requires real API key and incurs costs
  async fn live_test_image_generation_simple() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = image_generation(ImageGenerationArgs {
      api_key,
      prompt: "A serene mountain lake at sunrise, photorealistic".to_string(),
      model: None,
      n: None,
      aspect_ratio: Some("16:9".to_string()),
      resolution: Some("1k".to_string()),
      response_format: None,
      user: None,
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Generated {} image(s)", result.images.len());
    for (i, img) in result.images.iter().enumerate() {
      println!("  [{}] url={:?} revised_prompt={:?}", i, img.url, img.revised_prompt);
    }
    assert!(!result.images.is_empty());
    assert!(result.images[0].url.is_some(), "expected url-format response by default");
    Ok(())
  }
}
