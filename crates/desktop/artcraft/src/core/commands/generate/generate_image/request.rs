use artcraft_router::api::common_aspect_ratio::CommonAspectRatio;
use artcraft_router::api::common_resolution::CommonResolution;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::response::success_response_wrapper::SerializeMarker;

// ── Model ──

/// Unified image model enum covering text-to-image, image edit, and inpainting.
///
/// This is used in the Tauri command bridge.
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TauriImageModel {
  // Text-to-image models

  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_pro_11")]
  FluxPro11,
  #[serde(rename = "flux_pro_11_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "grok_image")]
  GrokImage,
  #[serde(rename = "recraft_3")]
  Recraft3,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "gpt_image_2")]
  GptImage2,
  #[serde(rename = "gemini_25_flash")]
  Gemini25Flash,
  #[serde(rename = "nano_banana")]
  NanoBanana,
  #[serde(rename = "nano_banana_2")]
  NanoBanana2,
  #[serde(rename = "nano_banana_pro")]
  NanoBananaPro,
  #[serde(rename = "seedream_4")]
  Seedream4,
  #[serde(rename = "seedream_4p5")]
  Seedream4p5,
  #[serde(rename = "seedream_5_lite")]
  Seedream5Lite,
  #[serde(rename = "midjourney")]
  Midjourney,

  // Image edit models

  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,
  #[serde(rename = "qwen_edit_2511_angles")]
  QwenEdit2511Angles,
  #[serde(rename = "flux_2_lora_angles")]
  Flux2LoraAngles,

  // Inpainting models

  #[serde(rename = "flux_dev_juggernaut")]
  FluxDevJuggernaut,
  #[serde(rename = "flux_pro_1")]
  FluxPro1,
}

impl TauriImageModel {
  pub fn to_common_model_type(&self) -> CommonModelType {
    match self {
      Self::Flux1Dev => CommonModelType::Flux1Dev,
      Self::Flux1Schnell => CommonModelType::Flux1Schnell,
      Self::FluxPro11 => CommonModelType::FluxPro11,
      Self::FluxPro11Ultra => CommonModelType::FluxPro11Ultra,
      Self::GrokImage => CommonModelType::GrokImage,
      Self::Recraft3 => CommonModelType::Recraft3,
      Self::GptImage1 => CommonModelType::GptImage1,
      Self::GptImage1p5 => CommonModelType::GptImage1p5,
      Self::GptImage2 => CommonModelType::GptImage2,
      Self::Gemini25Flash => CommonModelType::NanoBanana,
      Self::NanoBanana => CommonModelType::NanoBanana,
      Self::NanoBanana2 => CommonModelType::NanoBanana2,
      Self::NanoBananaPro => CommonModelType::NanoBananaPro,
      Self::Seedream4 => CommonModelType::Seedream4,
      Self::Seedream4p5 => CommonModelType::Seedream4p5,
      Self::Seedream5Lite => CommonModelType::Seedream5Lite,
      Self::Midjourney => CommonModelType::Midjourney,
      Self::FluxProKontextMax => CommonModelType::FluxProKontextMax,
      Self::QwenEdit2511Angles => CommonModelType::QwenEdit2511Angles,
      Self::Flux2LoraAngles => CommonModelType::Flux2LoraAngles,
      Self::FluxDevJuggernaut => CommonModelType::FluxDevJuggernaut,
      Self::FluxPro1 => CommonModelType::FluxPro1,
    }
  }
}

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
