use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;

// ── Request ──

#[derive(Deserialize, Debug)]
pub struct TauriGenerateImageRequest {
  /// The provider to use (defaults to Artcraft/Storyteller).
  /// Not all (provider, model) combinations are valid.
  pub provider: Option<GenerationProvider>,

  /// The model to use.
  pub model: Option<TauriImageModel>,

  /// Text prompt for the image generation.
  pub prompt: Option<String>,

  /// Aspect ratio.
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// Resolution.
  pub resolution: Option<CommonResolution>,

  /// Quality (used by OpenAI models).
  pub quality: Option<CommonQuality>,

  /// The number of images to generate.
  pub batch_size: Option<u32>,

  /// Reference images (without semantics).
  /// The purpose varies on a model-by-model basis.
  pub image_media_tokens: Option<Vec<MediaFileToken>>,

  // ── Canvas / scene images ──

  /// Supply this *XOR* `canvas_image_raw_bytes`.
  /// Becomes the first image reference (pushing back `image_media_tokens` by one).
  pub canvas_image_media_token: Option<MediaFileToken>,

  /// Supply this *XOR* `canvas_image_media_token`.
  /// Raw bytes of a canvas image.
  pub canvas_image_raw_bytes: Option<Vec<u8>>,

  /// Supply this *XOR* `scene_image_raw_bytes`.
  /// Becomes a scene reference image.
  pub scene_image_media_token: Option<MediaFileToken>,

  /// Supply this *XOR* `scene_image_media_token`.
  /// Raw bytes of a scene image.
  pub scene_image_raw_bytes: Option<Vec<u8>>,

  // ── Inpainting ──

  /// Supply this *XOR* `inpainting_mask_image_raw_bytes`.
  /// The mask to focus the edit (already uploaded).
  pub inpainting_mask_image_media_token: Option<MediaFileToken>,

  /// Supply this *XOR* `inpainting_mask_image_media_token`.
  /// The mask to focus the edit (raw bytes).
  pub inpainting_mask_image_raw_bytes: Option<Vec<u8>>,

  // ── Angle adjustment (for edit models like QwenEdit, Flux2LoraAngles) ──

  /// Horizontal angle adjustment.
  pub adjust_horizontal_angle: Option<f64>,

  /// Vertical angle adjustment.
  pub adjust_vertical_angle: Option<f64>,

  /// Zoom adjustment.
  pub adjust_zoom: Option<f64>,

  /// Turn on the system prompt.
  pub enable_system_prompt: Option<bool>,

  // ── Frontend metadata ──

  /// Name of the frontend caller.
  pub frontend_caller: Option<TauriCommandCaller>,

  /// A frontend-defined identifier sent back as a Tauri event on task completion.
  pub frontend_subscriber_id: Option<String>,

  /// A frontend-defined payload sent back as a Tauri event on task completion.
  pub frontend_subscriber_payload: Option<String>,
}

// ── Response ──

#[derive(Serialize)]
pub struct TauriGenerateImageResponse {
}

impl SerializeMarker for TauriGenerateImageResponse {}

// ── Error ──

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum TauriGenerateImageErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,
  /// Bad input
  BadInput,
  /// No provider available
  NoProviderAvailable,
  /// Generic server error
  ServerError,
  /// Needs to be logged into Artcraft
  NeedsStorytellerCredentials,
  /// Needs Grok credentials
  NeedsGrokCredentials,
  /// Billing issue
  BillingIssue,
}
