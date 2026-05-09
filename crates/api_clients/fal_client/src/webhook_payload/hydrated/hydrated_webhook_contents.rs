use serde::Deserialize;
use serde_json::Value;

use crate::webhook_payload::raw::webhook_error_type::WebhookErrorType;

/// The parsed inner payload of a FAL webhook.
#[derive(Debug)]
pub enum HydratedWebhookContents {
  /// The webhook reported success and has a payload.
  Success(WebhookSuccessData),

  /// The webhook reported an error (status=ERROR) with optional detail info.
  Error(ErrorData),

  /// The webhook reported as "success" but (1) had no payload and (2) had a payload_error.
  /// In rare instances of an "OK" response, there may be an error on Fal's end with encoding
  /// the payload. If that happens, the "payload_error" field may be set, and this enum variant
  /// represents that failure case.
  PayloadError(PayloadErrorData),
}

#[derive(Debug)]
pub struct WebhookSuccessData {
  /// The success data is polymorphic, so we're returning a JSON `Value` for now.
  /// This will allow for downstream handlers to parse the payload as needed.
  /// This is the entire raw success payload.
  pub payload: Value,

  /// If there are any extracted sub-payload contents, such as "images" or "video",
  /// then they are included here. This may not be fully inclusive of future
  /// payload types.
  pub extracted_contents: Option<ExtractedContents>,
}

#[derive(Debug)]
pub struct ExtractedContents {
  /// Parsed from `payload.image` (single image result).
  pub image: Option<ImageData>,

  /// Parsed from `payload.images` (batch image results).
  pub images: Option<Vec<ImagesData>>,

  /// Parsed from `payload.video`.
  pub video: Option<VideoData>,

  /// Parsed from `payload.model_glb`.
  pub model_glb: Option<ModelGlbData>,

  /// Parsed from `payload.model_mesh`.
  pub model_mesh: Option<ModelMeshData>,
  
  /// Parsed from `payload.thumbnail`.
  pub thumbnail: Option<ThumbnailData>,
}

/// Data under `payload.image`:
#[derive(Debug, Deserialize)]
pub struct ImageData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
  pub height: Option<u64>,
  pub width: Option<u64>,
}

/// Data under `payload.images` (a list of these):
#[derive(Debug, Deserialize)]
pub struct ImagesData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
  pub height: Option<u64>,
  pub width: Option<u64>,
}

/// Data under `payload.video`:
#[derive(Debug, Deserialize)]
pub struct VideoData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
}

/// Data under `payload.model_glb` (there may be other sibling keys too)
#[derive(Debug, Deserialize)]
pub struct ModelGlbData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

/// Data under `payload.model_mesh` (there may be other sibling keys too)
#[derive(Debug, Deserialize)]
pub struct ModelMeshData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

/// Data under `payload.thumbnail` (there may be other sibling keys too)
/// Frequently seen together with `model_glb`.
#[derive(Debug, Deserialize)]
pub struct ThumbnailData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

#[derive(Debug)]
pub struct ErrorData {
  /// The first human-readable message from `payload.detail[].msg`, if any.
  pub message: Option<String>,

  /// The first machine-readable error type from `payload.detail[].type`, if any.
  pub error_type: Option<WebhookErrorType>,
}

#[derive(Debug)]
pub struct PayloadErrorData {
  pub payload_error: String,
}
