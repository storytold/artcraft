use log::info;

use crate::creds::beeble_api_key::BeebleApiKey;
use crate::error::beeble_client_error::BeebleClientError;
use crate::error::beeble_error::BeebleError;
use crate::error::beeble_generic_api_error::BeebleGenericApiError;
use crate::error::beeble_specific_api_error::BeebleSpecificApiError;
use crate::requests::start_generation::request_types::*;

const BEEBLE_API_BASE_URL: &str = "https://api.beeble.ai/v1";

// ── Public types ──

#[derive(Clone, Debug)]
pub struct StartGenerationArgs {
  pub api_key: BeebleApiKey,
  pub request: StartGenerationRequest,
}

#[derive(Clone, Debug)]
pub struct StartGenerationRequest {
  /// "image" or "video".
  pub generation_type: BeebleGenerationType,
  /// Source image/video URI. Supports beeble://, https://, data: base64.
  pub source_uri: String,
  /// Alpha matte mode.
  pub alpha_mode: BeebleAlphaMode,

  /// Text description of desired output (max 2000 chars).
  pub prompt: Option<String>,
  /// URI for style transfer reference image.
  pub reference_image_uri: Option<String>,
  /// Custom alpha matte URI. Required for Custom and Select modes.
  pub alpha_uri: Option<String>,
  /// Maximum output resolution: 720 or 1080. Default 1080.
  pub max_resolution: Option<u16>,
  /// HTTPS webhook URL for completion notification.
  pub callback_url: Option<String>,
  /// Safe retry key preventing duplicate jobs (max 256 chars).
  pub idempotency_key: Option<String>,
}

#[derive(Copy, Clone, Debug)]
pub enum BeebleGenerationType {
  Image,
  Video,
}

#[derive(Copy, Clone, Debug)]
pub enum BeebleAlphaMode {
  /// Automatic alpha detection.
  Auto,
  /// Fill the entire frame.
  Fill,
  /// Use a custom alpha matte (requires alpha_uri).
  Custom,
  /// Select regions from the source (requires alpha_uri).
  Select,
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct StartGenerationSuccess {
  /// Job identifier (swx_...).
  pub id: String,
  /// in_queue, processing, completed, or failed.
  pub status: String,
  /// 0-100 progress percentage.
  pub progress: Option<u8>,
  pub generation_type: Option<String>,
  pub alpha_mode: Option<String>,
  pub output: Option<GenerationOutputResult>,
  pub error: Option<String>,
  pub created_at: Option<String>,
}

#[derive(Debug, Clone)]
pub struct GenerationOutputResult {
  /// URL to the rendered output. Expires after 72 hours.
  pub render: Option<String>,
  /// URL to the source. Expires after 72 hours.
  pub source: Option<String>,
  /// URL to the alpha matte. Expires after 72 hours.
  pub alpha: Option<String>,
}

// ── Implementation ──

/// Start a SwitchX compositing generation job.
pub async fn start_generation(args: StartGenerationArgs) -> Result<StartGenerationSuccess, BeebleError> {
  let url = format!("{}/switchx/generations", BEEBLE_API_BASE_URL);
  let req = args.request;

  info!("Starting Beeble generation: type={:?}, alpha_mode={:?}", req.generation_type, req.alpha_mode);

  let request_body = StartGenerationRequestBody {
    generation_type: match req.generation_type {
      BeebleGenerationType::Image => "image".to_string(),
      BeebleGenerationType::Video => "video".to_string(),
    },
    source_uri: req.source_uri,
    alpha_mode: match req.alpha_mode {
      BeebleAlphaMode::Auto => "auto".to_string(),
      BeebleAlphaMode::Fill => "fill".to_string(),
      BeebleAlphaMode::Custom => "custom".to_string(),
      BeebleAlphaMode::Select => "select".to_string(),
    },
    prompt: req.prompt,
    reference_image_uri: req.reference_image_uri,
    alpha_uri: req.alpha_uri,
    max_resolution: req.max_resolution,
    callback_url: req.callback_url,
    idempotency_key: req.idempotency_key,
  };

  let client = reqwest::Client::builder()
    .build()
    .map_err(|err| BeebleClientError::ReqwestClientError(err))?;

  let response = client.post(&url)
    .header("x-api-key", &args.api_key.api_key)
    .header("Content-Type", "application/json")
    .json(&request_body)
    .send()
    .await
    .map_err(|err| BeebleGenericApiError::ReqwestError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| BeebleGenericApiError::ReqwestError(err))?;

  info!("Beeble start generation response: status={}", status);

  match status.as_u16() {
    401 => return Err(BeebleSpecificApiError::Unauthorized.into()),
    402 => return Err(BeebleSpecificApiError::InsufficientCredits.into()),
    409 => return Err(BeebleSpecificApiError::IdempotencyConflict.into()),
    429 => return Err(BeebleSpecificApiError::RateLimited.into()),
    _ if !status.is_success() => {
      return Err(BeebleGenericApiError::UncategorizedBadResponseWithStatusAndBody {
        status_code: status,
        body: response_body,
      }.into());
    }
    _ => {}
  }

  let parsed: GenerationJobResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| BeebleGenericApiError::SerdeResponseParseError(err, response_body.clone()))?;

  Ok(map_job_response(parsed))
}

pub(crate) fn map_job_response(parsed: GenerationJobResponseBody) -> StartGenerationSuccess {
  StartGenerationSuccess {
    id: parsed.id,
    status: parsed.status,
    progress: parsed.progress,
    generation_type: parsed.generation_type,
    alpha_mode: parsed.alpha_mode,
    output: parsed.output.map(|o| GenerationOutputResult {
      render: o.render,
      source: o.source,
      alpha: o.alpha,
    }),
    error: parsed.error,
    created_at: parsed.created_at,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::start_generation::request_types::GenerationJobResponseBody;

  #[test]
  fn request_body_serializes_minimal() {
    let body = StartGenerationRequestBody {
      generation_type: "image".to_string(),
      source_uri: "beeble://upload_abc/photo.jpg".to_string(),
      alpha_mode: "auto".to_string(),
      prompt: None,
      reference_image_uri: None,
      alpha_uri: None,
      max_resolution: None,
      callback_url: None,
      idempotency_key: None,
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"generation_type\":\"image\""));
    assert!(json.contains("\"alpha_mode\":\"auto\""));
    // Optional fields should not be present
    assert!(!json.contains("prompt"));
    assert!(!json.contains("reference_image_uri"));
  }

  #[test]
  fn request_body_serializes_full() {
    let body = StartGenerationRequestBody {
      generation_type: "video".to_string(),
      source_uri: "https://example.com/video.mp4".to_string(),
      alpha_mode: "custom".to_string(),
      prompt: Some("A sunny beach".to_string()),
      reference_image_uri: Some("beeble://upload_ref/ref.jpg".to_string()),
      alpha_uri: Some("beeble://upload_alpha/mask.png".to_string()),
      max_resolution: Some(1080),
      callback_url: Some("https://example.com/webhook".to_string()),
      idempotency_key: Some("my-key-123".to_string()),
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("\"prompt\":\"A sunny beach\""));
    assert!(json.contains("\"max_resolution\":1080"));
    assert!(json.contains("\"idempotency_key\":\"my-key-123\""));
  }

  #[test]
  fn response_body_deserializes_queued() {
    let json = r#"{
      "id": "swx_abc123",
      "status": "in_queue",
      "progress": null,
      "generation_type": "image",
      "alpha_mode": "auto",
      "output": null,
      "error": null,
      "created_at": "2026-05-08T00:00:00Z",
      "modified_at": "2026-05-08T00:00:00Z",
      "completed_at": null,
      "webhook": null
    }"#;
    let parsed: GenerationJobResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.id, "swx_abc123");
    assert_eq!(parsed.status, "in_queue");
    assert!(parsed.output.is_none());
  }

  #[test]
  fn response_body_deserializes_completed() {
    let json = r#"{
      "id": "swx_abc123",
      "status": "completed",
      "progress": 100,
      "generation_type": "image",
      "alpha_mode": "auto",
      "output": {
        "render": "https://cdn.beeble.ai/render.png",
        "source": "https://cdn.beeble.ai/source.png",
        "alpha": "https://cdn.beeble.ai/alpha.png"
      },
      "error": null,
      "created_at": "2026-05-08T00:00:00Z",
      "modified_at": "2026-05-08T00:00:01Z",
      "completed_at": "2026-05-08T00:00:01Z",
      "webhook": null
    }"#;
    let parsed: GenerationJobResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.status, "completed");
    assert_eq!(parsed.progress, Some(100));
    let output = parsed.output.unwrap();
    assert!(output.render.unwrap().contains("render.png"));
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key and incurs costs
  async fn test_start_image_generation() -> errors::AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;

    let api_key = get_test_api_key()?;
    let result = start_generation(StartGenerationArgs {
      api_key,
      request: StartGenerationRequest {
        generation_type: BeebleGenerationType::Image,
        source_uri: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800".to_string(),
        alpha_mode: BeebleAlphaMode::Auto,
        prompt: Some("A tropical beach at sunset".to_string()),
        reference_image_uri: None,
        alpha_uri: None,
        max_resolution: Some(720),
        callback_url: None,
        idempotency_key: None,
      },
    }).await?;

    println!("Job ID: {}", result.id);
    println!("Status: {}", result.status);
    println!("Progress: {:?}", result.progress);
    assert!(result.id.starts_with("swx_"));
    Ok(())
  }

  // ── Helpers for end-to-end tests ──

  async fn download_bytes(url: &str) -> errors::AnyhowResult<Vec<u8>> {
    let response = reqwest::get(url).await?;
    let bytes = response.bytes().await?;
    Ok(bytes.to_vec())
  }

  fn guess_content_type(filename: &str) -> &'static str {
    if filename.ends_with(".mp4") { "video/mp4" }
    else if filename.ends_with(".mov") { "video/quicktime" }
    else if filename.ends_with(".png") { "image/png" }
    else if filename.ends_with(".jpg") || filename.ends_with(".jpeg") { "image/jpeg" }
    else if filename.ends_with(".webp") { "image/webp" }
    else { "application/octet-stream" }
  }

  async fn upload_asset_bytes(
    api_key: &crate::creds::beeble_api_key::BeebleApiKey,
    filename: &str,
    bytes: Vec<u8>,
  ) -> errors::AnyhowResult<crate::requests::create_upload_url::create_upload_url::CreateUploadUrlSuccess> {
    use crate::requests::create_upload_url::create_upload_url::{
      create_upload_url, CreateUploadUrlArgs,
    };

    // 1. Get presigned upload URL.
    let upload = create_upload_url(CreateUploadUrlArgs {
      api_key: api_key.clone(),
      filename: filename.to_string(),
    }).await.map_err(|e| anyhow::anyhow!("create_upload_url failed: {:?}", e))?;

    println!("Upload ID: {}", upload.id);
    println!("Upload URL: {}", upload.upload_url);
    println!("Beeble URI: {}", upload.beeble_uri);

    // 2. PUT file bytes to the presigned URL with correct Content-Type.
    let content_type = guess_content_type(filename);
    println!("Uploading {} bytes with Content-Type: {}", bytes.len(), content_type);

    let client = reqwest::Client::new();
    let put_response = client.put(&upload.upload_url)
      .header("Content-Type", content_type)
      .body(bytes)
      .send()
      .await?;

    let put_status = put_response.status();
    let put_body = put_response.text().await.unwrap_or_default();
    println!("PUT upload status: {} body: {}", put_status, put_body);
    assert!(put_status.is_success(), "PUT upload failed: {} body: {}", put_status, put_body);

    Ok(upload)
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, downloads files, incurs costs
  async fn test_end_to_end_video_generation() -> errors::AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL;
    use test_data::web::video_urls::ANGRY_SHIBA_VIDEO_URL;

    let api_key = get_test_api_key()?;

    // 1. Download the source video.
    println!("Downloading video...");
    let video_bytes = download_bytes(ANGRY_SHIBA_VIDEO_URL).await?;
    println!("Downloaded video: {} bytes", video_bytes.len());

    // 2. Download the reference image.
    println!("Downloading image...");
    let image_bytes = download_bytes(FOREST_BACKDROP_IMAGE_URL).await?;
    println!("Downloaded image: {} bytes", image_bytes.len());

    // 3. Upload the video.
    println!("Uploading video...");
    let video_upload = upload_asset_bytes(&api_key, "shiba.mp4", video_bytes).await?;

    // 4. Upload the reference image.
    println!("Uploading image...");
    let image_upload = upload_asset_bytes(&api_key, "forest.jpg", image_bytes).await?;

    // 5. Start generation.
    println!("Starting generation...");
    let result = start_generation(StartGenerationArgs {
      api_key,
      request: StartGenerationRequest {
        generation_type: BeebleGenerationType::Video,
        source_uri: video_upload.beeble_uri,
        alpha_mode: BeebleAlphaMode::Auto,
        prompt: Some("Place the dog in a forest setting".to_string()),
        reference_image_uri: Some(image_upload.beeble_uri),
        alpha_uri: None,
        max_resolution: Some(720),
        callback_url: None,
        idempotency_key: None,
      },
    }).await.map_err(|e| anyhow::anyhow!("start_generation failed: {:?}", e))?;

    println!("Job ID: {}", result.id);
    println!("Status: {}", result.status);
    println!("Progress: {:?}", result.progress);
    assert!(result.id.starts_with("swx_"));

    // NB: We don't poll to completion here — that would take too long for a test.
    // Use get_job_status to poll manually if needed.

    Ok(())
  }
}
