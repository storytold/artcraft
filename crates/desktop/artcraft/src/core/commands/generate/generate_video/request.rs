use artcraft_router::api::common_aspect_ratio::CommonAspectRatio;
use artcraft_router::api::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::response::success_response_wrapper::SerializeMarker;

/// This is used in the Tauri command bridge.
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TauriVideoModel {
  #[serde(rename = "grok_video")]
  GrokVideo,

  #[serde(rename = "kling_1.6_pro")]
  Kling16Pro,

  #[serde(rename = "kling_2.1_pro")]
  Kling21Pro,

  #[serde(rename = "kling_2.1_master")]
  Kling21Master,

  #[serde(rename = "kling_2p5_turbo_pro")]
  Kling2p5TurboPro,

  #[serde(rename = "kling_2p6_pro")]
  Kling2p6Pro,

  #[serde(rename = "kling_3p0_standard")]
  Kling3p0Standard,

  #[serde(rename = "kling_3p0_pro")]
  Kling3p0Pro,

  #[serde(rename = "happy_horse_1p0")]
  HappyHorse1p0,

  #[serde(rename = "seedance_1.0_lite")]
  Seedance10Lite,

  #[serde(rename = "seedance_1p5_pro")]
  Seedance1p5Pro,

  #[serde(rename = "seedance_2p0")]
  Seedance2p0,

  #[serde(rename = "seedance_2p0_fast")]
  Seedance2p0Fast,

  #[serde(rename = "sora_2")]
  Sora2,

  #[serde(rename = "sora_2_pro")]
  Sora2Pro,

  #[serde(rename = "veo_2")]
  Veo2,

  #[serde(rename = "veo_3")]
  Veo3,

  #[serde(rename = "veo_3_fast")]
  Veo3Fast,

  #[serde(rename = "veo_3p1")]
  Veo3p1,

  #[serde(rename = "veo_3p1_fast")]
  Veo3p1Fast,
}

#[derive(Deserialize, Debug, Clone)]
pub struct TauriGenerateVideoRequest {
  pub provider: Option<GenerationProvider>,
  pub model: Option<TauriVideoModel>,

  pub prompt: Option<String>,
  pub negative_prompt: Option<String>,

  #[deprecated(note = "Use start_frame_image_media_token instead")]
  pub image_media_token: Option<MediaFileToken>,

  pub start_frame_image_media_token: Option<MediaFileToken>,
  pub end_frame_image_media_token: Option<MediaFileToken>,

  pub reference_image_media_tokens: Option<Vec<MediaFileToken>>,
  pub reference_video_media_tokens: Option<Vec<MediaFileToken>>,
  pub reference_audio_media_tokens: Option<Vec<MediaFileToken>>,
  pub reference_character_tokens: Option<Vec<CharacterToken>>,

  pub aspect_ratio: Option<CommonAspectRatio>,
  pub resolution: Option<CommonResolution>,

  pub duration_seconds: Option<u16>,
  pub generate_audio: Option<bool>,
  pub video_batch_count: Option<u16>,

  #[deprecated(note = "Use start_frame_image_media_token instead")]
  pub sora_orientation: Option<SoraOrientation>,

  #[deprecated(note = "Use start_frame_image_media_token instead")]
  pub grok_aspect_ratio: Option<GrokAspectRatio>,

  pub frontend_caller: Option<TauriCommandCaller>,
  pub frontend_subscriber_id: Option<String>,
  pub frontend_subscriber_payload: Option<String>,
}

#[derive(Deserialize, Debug, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum SoraOrientation {
  Portrait,
  Landscape,
}

#[derive(Deserialize, Debug, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum GrokAspectRatio {
  Portrait,
  Landscape,
  Square,
}

#[derive(Serialize)]
pub struct TauriGenerateVideoResponse {
}

impl SerializeMarker for TauriGenerateVideoResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum TauriGenerateVideoErrorType {
  ModelNotSpecified,
  NoProviderAvailable,
  ServerError,
  NeedsFalApiKey,
  FalError,
  NeedsStorytellerCredentials,
}
