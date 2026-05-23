use log::info;
use serde_derive::Serialize;

use crate::api::requests::images::image_generation::request_types::*;
use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::api::types::image_types::image_aspect_ratio::ImageAspectRatio;
use crate::api::types::image_types::image_model::ImageModel;
use crate::api::types::image_types::image_resolution::ImageResolution;
use crate::api::types::image_types::image_response_format::ImageResponseFormat;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;

// ── Public args ──

/// Top-level argument to [`image_generation`]. Borrows the API key separately
/// from the request body so callers can log/save [`ImageGenerationRequest`]
/// without leaking the credential.
#[derive(Clone, Debug)]
pub struct ImageGenerationArgs<'a> {
  pub api_key: &'a GrokApiKey,
  pub request: ImageGenerationRequest,
}

/// The material part of an image-generation request. Derives [`Serialize`] so
/// it can be persisted to a log or audit store independently of the API key.
#[derive(Clone, Debug, Serialize)]
pub struct ImageGenerationRequest {
  /// Text prompt describing the image. Required.
  pub prompt: String,

  /// Model identifier. Defaults to [`ImageModel::GrokImagineImageQuality`]
  /// when `None`. Use [`ImageModel::Custom`] for identifiers not yet listed
  /// in the enum.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<ImageModel>,

  /// Number of images to render in this request. xAI's docs don't state a
  /// hard maximum; server default is 1 when `None`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub number_images: Option<u32>,

  /// Aspect ratio. See [`ImageAspectRatio`] for the closed set of accepted
  /// values. Server default when `None`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<ImageAspectRatio>,

  /// Output resolution tier. See [`ImageResolution`]. Server default when `None`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<ImageResolution>,

  /// Url (default) or b64 inline. See [`ImageResponseFormat`].
  #[serde(skip_serializing_if = "Option::is_none")]
  pub response_format: Option<ImageResponseFormat>,

  /// Optional opaque user identifier for usage attribution.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub user: Option<String>,
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
pub async fn image_generation(args: ImageGenerationArgs<'_>) -> Result<ImageGenerationSuccess, GrokError> {
  let req = args.request;

  let url = format!("{}/v1/images/generations", XAI_API_BASE_URL);
  let model = req.model.unwrap_or(ImageModel::GrokImagineImageQuality);

  info!(
    "Grok image_generation: model={}, number_images={:?}, aspect_ratio={:?}, resolution={:?}",
    model.as_str(), req.number_images,
    req.aspect_ratio.map(|a| a.as_str()),
    req.resolution.map(|r| r.as_str()),
  );

  let request_body = ImageGenerationRequestBody {
    prompt: req.prompt,
    model: Some(model.as_str().to_string()),
    n: req.number_images,
    aspect_ratio: req.aspect_ratio.map(|a| a.as_str().to_string()),
    resolution: req.resolution.map(|r| r.as_str().to_string()),
    response_format: req.response_format.map(|f| f.as_str().to_string()),
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

  // ── Wire-format shape tests (internal ImageGenerationRequestBody) ──

  #[test]
  fn wire_body_serializes_minimal() {
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
    assert!(!json.contains("\"n\""));
    assert!(!json.contains("\"aspect_ratio\""));
    assert!(!json.contains("\"user\""));
  }

  #[test]
  fn wire_body_serializes_full() {
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

  // ── Public-API shape tests: ImageGenerationRequest must serialize cleanly ──

  #[test]
  fn request_serializes_with_typed_enums() {
    let req = ImageGenerationRequest {
      prompt: "a serene lake".to_string(),
      model: Some(ImageModel::GrokImagineImageQuality),
      number_images: Some(3),
      aspect_ratio: Some(ImageAspectRatio::Landscape16x9),
      resolution: Some(ImageResolution::OneK),
      response_format: Some(ImageResponseFormat::Url),
      user: None,
    };
    let json = serde_json::to_string(&req).unwrap();
    assert!(json.contains("\"prompt\":\"a serene lake\""));
    assert!(json.contains("\"model\":\"grok-imagine-image-quality\""));
    assert!(json.contains("\"number_images\":3"));
    assert!(json.contains("\"aspect_ratio\":\"16:9\""));
    assert!(json.contains("\"resolution\":\"1k\""));
    assert!(json.contains("\"response_format\":\"url\""));
    assert!(!json.contains("\"user\""));
  }

  #[test]
  fn request_does_not_serialize_api_key() {
    let key = GrokApiKey::new("secret_value_must_not_leak".to_string());
    let args = ImageGenerationArgs {
      api_key: &key,
      request: ImageGenerationRequest {
        prompt: "p".to_string(),
        model: None,
        number_images: None,
        aspect_ratio: None,
        resolution: None,
        response_format: None,
        user: None,
      },
    };
    let json = serde_json::to_string(&args.request).unwrap();
    assert!(!json.contains("secret_value_must_not_leak"),
      "serialized request must not contain the API key. got: {}", json);
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

  // ── Live API tests (ignored — incur cost) ──

  #[tokio::test]
  #[ignore] // manually test — requires real API key and incurs costs
  async fn live_test_image_generation_simple() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = image_generation(ImageGenerationArgs {
      api_key: &api_key,
      request: ImageGenerationRequest {
        prompt: "A serene mountain lake at sunrise, photorealistic".to_string(),
        model: None,
        number_images: None,
        aspect_ratio: Some(ImageAspectRatio::Landscape16x9),
        resolution: Some(ImageResolution::OneK),
        response_format: None,
        user: None,
      },
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
