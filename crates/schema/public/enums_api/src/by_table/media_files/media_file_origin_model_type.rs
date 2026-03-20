use serde::Deserialize;
use serde::Serialize;
use strum::EnumIter;
use utoipa::ToSchema;

/// Report certain models publicly as different from what we actually use.
/// This is so we have an edge against the competition that might try to run
/// the same models. This won't always make sense, but in some cases it will.
///
/// This was previously named `PublicMediaFileModelType` in the `enums_public` crate.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, Debug, EnumIter)]
#[serde(rename_all = "snake_case")]
pub enum MediaFileOriginModelType {
  // Renamed enum variants

  /// Instead of DB `MediaFileOriginModelType::LivePortrait` ("live_portrait")
  #[serde(rename = "face_mirror")]
  FaceMirror,

  /// Instead of DB `MediaFileOriginModelType::SadTalker` ("sad_talker")
  #[serde(rename = "face_animator")]
  FaceAnimator,

  /// Instead of DB `MediaFileOriginModelType::FaceFusion` ("face_fusion")
  #[serde(rename = "lipsync")]
  Lipsync,

  /// Instead of DB `MediaFileOriginModelType::StyleTTS2` ("styletts2")
  #[serde(rename = "voice_designer")]
  VoiceDesigner,

  // Everything else is the same

  /// RVC (v2) voice conversion models
  #[serde(rename = "rvc_v2")]
  RvcV2,

  /// so-vits-svc voice conversion models
  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,

  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "mocap_net")]
  MocapNet,

  #[serde(rename = "stable_diffusion_1_5")]
  StableDiffusion15,

  #[serde(rename = "gpt_sovits")]
  GptSovits,

  #[serde(rename = "f5_tts")]
  F5TTS,

  #[serde(rename = "seed_vc")]
  SeedVc,

  #[serde(rename = "studio")]
  StorytellerStudio,

  /// NB: This is GPT4o image generation
  #[serde(rename = "studio_ig")]
  StorytellerStudioImageGen,

  #[serde(rename = "vst")]
  VideoStyleTransfer,

  #[deprecated(note = "This is not a model type!")]
  #[serde(rename = "comfy_ui")]
  ComfyUi,

  #[deprecated(note = "We don't use this anymore")]
  #[serde(rename = "vall_e_x")]
  VallEX,

  #[deprecated(note = "We don't use this anymore")]
  #[serde(rename = "rerender")]
  Rerender,
}
