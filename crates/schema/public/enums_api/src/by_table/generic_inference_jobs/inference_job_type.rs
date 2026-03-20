use strum::EnumIter;
use utoipa::ToSchema;

/// Report certain jobs publicly as different from what we actually run.
/// This is so we have an edge against the competition that might try to run
/// the same models or workflows.
///
/// Previously named `PublicInferenceJobType` in the `enums_public` crate.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default, ToSchema, Debug, EnumIter)]
#[serde(rename_all = "snake_case")]
pub enum InferenceJobType {
  // ======= Renamed enum variants  ======

  /// Instead of DB `InferenceJobType::LivePortrait` ("live_portrait")
  ActingFace,

  /// Instead of DB `InferenceJobType::FaceFusion` ("face_fusion")
  Lipsync,

  /// Storyteller Studio and Video Style Transfer Jobs.
  VideoRender,

  GptSovits,

  #[serde(rename = "f5_tts")]
  F5TTS,

  // ======= Everything else is the same =======

  #[serde(rename = "fal_queue")]
  FalQueue,

  #[deprecated(note = "Use VideoRender instead.")]
  ComfyUi,

  #[serde(rename = "studio_gen2")]
  StudioGen2,

  #[serde(rename = "convert_fbx_gltf")]
  ConvertFbxToGltf,

  MocapNet,

  #[serde(rename = "rvc_v2")]
  RvcV2,

  SadTalker,

  #[serde(rename = "seed_vc")]
  SeedVc,

  SoVitsSvc,

  StableDiffusion,

  #[serde(rename = "styletts2")]
  StyleTTS2,

  Tacotron2,

  #[default]
  Unknown,

  #[deprecated(note = "This was for Bevy engine's server side rendering.")]
  #[serde(rename = "bevy_to_workflow")]
  BevyToWorkflow,

  #[deprecated(note = "This was for ReRenderAVideo, which we never productionized.")]
  RerenderAVideo,

  #[serde(rename = "image_gen_api")]
  ImageGenApi,

  #[serde(rename = "seedance2pro_queue")]
  Seedance2ProQueue,

  #[serde(rename = "worldlabs_queue")]
  WorldlabsQueue,
}

