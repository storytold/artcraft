use log::info;

use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::error::grok_specific_api_error::GrokSpecificApiError;
use crate::api::requests::image_edit::request_types::*;
use crate::api::types::image_types::image_aspect_ratio::ImageAspectRatio;
use crate::api::types::image_types::image_model::ImageModel;
use crate::api::types::image_types::image_resolution::ImageResolution;
use crate::api::types::image_types::image_response_format::ImageResponseFormat;
use crate::api::requests::xai_host::XAI_API_BASE_URL;

// ── Public args ──

#[derive(Clone, Debug)]
pub struct ImageEditArgs {
  pub api_key: GrokApiKey,

  /// Edit instruction. Required.
  pub prompt: String,

  /// One or more source images. xAI supports up to 3.
  /// The output aspect ratio follows the first input image unless overridden.
  pub source_images: Vec<ImageSource>,

  /// Model identifier. Defaults to [`ImageModel::GrokImagineImageQuality`] when `None`.
  pub model: Option<ImageModel>,

  /// Number of edited images to render. Server default is 1 when `None`.
  pub number_images: Option<u32>,

  /// Aspect ratio. See [`ImageAspectRatio`]. When `None`, xAI defaults to
  /// matching the first input image.
  pub aspect_ratio: Option<ImageAspectRatio>,

  /// Output resolution tier. See [`ImageResolution`].
  pub resolution: Option<ImageResolution>,

  /// `Url` (default) or `B64Json`.
  pub response_format: Option<ImageResponseFormat>,

  pub user: Option<String>,
}

/// Source image — pick by URL or by `file_id` (from a prior upload).
#[derive(Clone, Debug)]
pub enum ImageSource {
  /// Either a public HTTPS URL or a `data:` URI containing base64-encoded
  /// image bytes.
  Url(String),

  /// xAI file identifier (`file_...`) obtained from a successful upload via
  /// [`crate::api::requests::upload_file::upload_file::upload_file`]. The file
  /// must still exist at request time (it has not been deleted and any
  /// `expires_after` has not lapsed).
  ///
  /// Docs:
  /// - <https://docs.x.ai/developers/rest-api-reference/files/upload>
  /// - <https://docs.x.ai/developers/rest-api-reference/files/manage>
  FileId(String),
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct ImageEditSuccess {
  pub images: Vec<EditedImage>,
}

#[derive(Debug, Clone)]
pub struct EditedImage {
  pub url: Option<String>,
  pub b64_json: Option<String>,
  pub revised_prompt: Option<String>,
}

// ── Implementation ──

/// POST https://api.x.ai/v1/images/edits — edit one or more source images
/// according to a text prompt.
///
/// Docs:
/// - <https://docs.x.ai/developers/model-capabilities/images/editing>
/// - <https://docs.x.ai/developers/model-capabilities/images/multi-image-editing>
pub async fn image_edit(args: ImageEditArgs) -> Result<ImageEditSuccess, GrokError> {
  if args.source_images.is_empty() {
    return Err(GrokSpecificApiError::BadRequest(
      "image_edit requires at least one source image".to_string(),
    ).into());
  }

  let url = format!("{}/v1/images/edits", XAI_API_BASE_URL);
  let model = args.model.unwrap_or(ImageModel::GrokImagineImageQuality);

  info!(
    "Grok image_edit: model={}, sources={}, aspect_ratio={:?}, resolution={:?}",
    model.as_str(), args.source_images.len(),
    args.aspect_ratio.map(|a| a.as_str()),
    args.resolution.map(|r| r.as_str()),
  );

  // Single source → `image`. Multiple sources → `images`.
  let (image, images) = if args.source_images.len() == 1 {
    (Some(to_image_ref(&args.source_images[0])), None)
  } else {
    (None, Some(args.source_images.iter().map(to_image_ref).collect()))
  };

  let request_body = ImageEditRequestBody {
    prompt: args.prompt,
    image,
    images,
    model: Some(model.as_str().to_string()),
    n: args.number_images,
    aspect_ratio: args.aspect_ratio.map(|a| a.as_str().to_string()),
    resolution: args.resolution.map(|r| r.as_str().to_string()),
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

  info!("Grok image_edit response: status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: ImageEditResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(ImageEditSuccess {
    images: parsed.data.into_iter().map(|d| EditedImage {
      url: d.url,
      b64_json: d.b64_json,
      revised_prompt: d.revised_prompt,
    }).collect(),
  })
}

fn to_image_ref(source: &ImageSource) -> ImageRef {
  match source {
    ImageSource::Url(u) => ImageRef { url: Some(u.clone()), file_id: None },
    ImageSource::FileId(id) => ImageRef { url: None, file_id: Some(id.clone()) },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use errors::AnyhowResult;

  // ── Shape tests ──

  #[test]
  fn single_source_serializes_as_image_field() {
    let body = ImageEditRequestBody {
      prompt: "make it sepia".to_string(),
      image: Some(ImageRef { url: Some("https://example.com/a.png".to_string()), file_id: None }),
      images: None,
      model: Some("grok-imagine-image-quality".to_string()),
      n: None,
      aspect_ratio: None,
      resolution: None,
      response_format: None,
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"image\":{"));
    assert!(!json.contains("\"images\""));
    assert!(json.contains("\"url\":\"https://example.com/a.png\""));
  }

  #[test]
  fn multi_source_serializes_as_images_array() {
    let body = ImageEditRequestBody {
      prompt: "combine these".to_string(),
      image: None,
      images: Some(vec![
        ImageRef { url: Some("https://example.com/a.png".to_string()), file_id: None },
        ImageRef { url: None, file_id: Some("file_xyz".to_string()) },
      ]),
      model: None,
      n: None,
      aspect_ratio: Some("1:1".to_string()),
      resolution: None,
      response_format: None,
      user: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"images\":["));
    assert!(!json.contains("\"image\":{"));
    assert!(json.contains("\"file_id\":\"file_xyz\""));
    assert!(json.contains("\"aspect_ratio\":\"1:1\""));
  }

  #[tokio::test]
  async fn empty_sources_returns_bad_request() {
    let api_key = GrokApiKey::new("dummy".to_string());
    let result = image_edit(ImageEditArgs {
      api_key,
      prompt: "edit".to_string(),
      source_images: vec![],
      model: None,
      number_images: None,
      aspect_ratio: None,
      resolution: None,
      response_format: None,
      user: None,
    }).await;
    let err = result.unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::BadRequest(_))));
  }

  #[test]
  fn response_body_deserializes_url() {
    let json = r#"{ "data": [ { "url": "https://imagine.x.ai/edit.png" } ] }"#;
    let parsed: ImageEditResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.data[0].url.as_deref(), Some("https://imagine.x.ai/edit.png"));
  }

  #[test]
  fn image_ref_url_only() {
    let r = ImageRef { url: Some("u".to_string()), file_id: None };
    let json = serde_json::to_string(&r).unwrap();
    assert!(json.contains("\"url\":\"u\""));
    assert!(!json.contains("\"file_id\""));
  }

  #[test]
  fn image_ref_file_id_only() {
    let r = ImageRef { url: None, file_id: Some("f".to_string()) };
    let json = serde_json::to_string(&r).unwrap();
    assert!(json.contains("\"file_id\":\"f\""));
    assert!(!json.contains("\"url\""));
  }

  // ── Live API tests ──

  #[tokio::test]
  #[ignore] // manually test — requires real API key and incurs costs
  async fn live_test_image_edit_single() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = image_edit(ImageEditArgs {
      api_key,
      prompt: "Render this as a pencil sketch with detailed shading".to_string(),
      source_images: vec![ImageSource::Url(
        "https://docs.x.ai/assets/api-examples/images/style-realistic.png".to_string()
      )],
      model: None,
      number_images: None,
      aspect_ratio: None,
      resolution: None,
      response_format: None,
      user: None,
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Edited {} image(s)", result.images.len());
    for (i, img) in result.images.iter().enumerate() {
      println!("  [{}] url={:?}", i, img.url);
    }
    assert!(!result.images.is_empty());
    Ok(())
  }
}
