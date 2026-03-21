use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `product_category`.
///
/// This is a user-facing and analytics-facing column that describes what product area the job
/// is attributed to. For example, this will help us separate "video style transfer" from
/// "storyteller studio" and also separate "live portrait" from "webcam live portrait".
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, Default, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]
pub enum InferenceJobProductCategory {
  // =============== DOWNLOAD ===============

  /// Download: GptSoVits
  #[default]
  DownloadGptSoVits,
  
  // =============== FAL ===============
  
  FalImage,
  FalVideo,
  /// Fal: 3D Object Generation
  FalObject,
  FalBgRemoval,

  // =============== SEEDANCE 2 PRO ===============

  #[serde(rename = "seedance2pro_video")]
  Seedance2ProVideo,

  // =============== WORLD LABS ===============

  /// World Labs: Gaussian Splat Generation
  #[serde(rename = "worldlabs_splat")]
  WorldlabsSplat,

  // =============== TEXT TO SPEECH ===============

  /// TTS: GptSoVits
  TtsGptSoVits,

  /// TTS: F5Tts (Zero Shot)
  TtsF5,

  /// TTS: StyleTts2 (Zero Shot)
  TtsStyleTts2,
  
  /// TTS: Tacotron2
  TtsTacotron2,

  // =============== VOICE CONVERSION ===============

  /// Voice Conversion: RVC v2
  VcRvc2,

  /// Voice Conversion: SoVitsSvc
  VcSvc,

  VcSeedVc, // Ugh

  // =============== VIDEO ===============

  /// Video: Face Fusion (Lipsync)
  VidLipsyncFaceFusion,

  /// Video: Sad Talker (Lipsync)
  VidLipsyncSadTalker,

  /// Live Portrait (normal interface)
  VidLivePortrait,

  /// Live Portrait (webcam interface)
  VidLivePortraitWebcam,

  /// Video: Studio
  VidStudio,

  /// Video: Studio Gen 2
  VidStudioGen2,

  /// Video: Style Transfer
  VidStyleTransfer,

  // =============== DEPRECATED ===============

  /// Lipsync: Face Fusion
  #[deprecated(note = "Use `VidLipsyncFaceFusion` instead")]
  LipsyncFaceFusion,

  /// Lipsync: SadTalker
  #[deprecated(note = "Use `VidLipsyncSadTalker` instead")]
  LipsyncSadTalker,

  /// Live Portrait (normal interface)
  #[deprecated(note = "Use `VidLivePortrait` instead")]
  LivePortrait,

  /// Live Portrait (webcam interface)
  #[deprecated(note = "Use `VidLivePortraitWebcam` instead")]
  LivePortraitWebcam,

  /// Stable Diffusion (deprecated)
  #[deprecated(note = "unused")]
  StableDiffusion,

  /// Storyteller Studio
  #[deprecated(note = "Use `VidStudio` instead")]
  Studio,

  /// Lipsync: Face Fusion
  #[deprecated(note = "Use `VidLipsyncFaceFusion` instead")]
  VidFaceFusion,

  /// Video Style Transfer
  #[deprecated(note = "Use `VidStyleTransfer` instead")]
  Vst,
}

/// NB: Legacy API for older code.
impl InferenceJobProductCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::DownloadGptSoVits => "download_gpt_so_vits",
      Self::FalImage => "fal_image",
      Self::FalVideo => "fal_video",
      Self::FalObject => "fal_object",
      Self::FalBgRemoval => "fal_bg_removal",
      Self::Seedance2ProVideo => "seedance2pro_video",
      Self::WorldlabsSplat => "worldlabs_splat",
      Self::TtsGptSoVits => "tts_gpt_so_vits",
      Self::TtsStyleTts2 => "tts_style_tts2",
      Self::TtsTacotron2 => "tts_tacotron2",
      Self::TtsF5 => "tts_f5",
      Self::VcSvc => "vc_svc",
      Self::VcRvc2 => "vc_rvc2",
      Self::VcSeedVc => "vc_seed_vc",
      Self::VidLipsyncFaceFusion => "vid_lipsync_face_fusion",
      Self::VidLipsyncSadTalker => "vid_lipsync_sad_talker",
      Self::VidLivePortrait => "vid_live_portrait",
      Self::VidLivePortraitWebcam => "vid_live_portrait_webcam",
      Self::VidStudio => "vid_studio",
      Self::VidStudioGen2 => "vid_studio_gen2",
      Self::VidStyleTransfer => "vid_style_transfer",
      Self::LipsyncFaceFusion => "lipsync_face_fusion",
      Self::LipsyncSadTalker => "lipsync_sad_talker",
      Self::LivePortrait => "live_portrait",
      Self::LivePortraitWebcam => "live_portrait_webcam",
      Self::StableDiffusion => "stable_diffusion",
      Self::Studio => "studio",
      Self::VidFaceFusion => "vid_face_fusion",
      Self::Vst => "vst",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "download_gpt_so_vits" => Ok(Self::DownloadGptSoVits),
      "fal_image" => Ok(Self::FalImage),
      "fal_video" => Ok(Self::FalVideo),
      "fal_object" => Ok(Self::FalObject),
      "fal_bg_removal" => Ok(Self::FalBgRemoval),
      "seedance2pro_video" => Ok(Self::Seedance2ProVideo),
      "worldlabs_splat" => Ok(Self::WorldlabsSplat),
      "tts_gpt_so_vits" => Ok(Self::TtsGptSoVits),
      "tts_style_tts2" => Ok(Self::TtsStyleTts2),
      "tts_tacotron2" => Ok(Self::TtsTacotron2),
      "tts_f5" => Ok(Self::TtsF5),
      "vc_svc" => Ok(Self::VcSvc),
      "vc_rvc2" => Ok(Self::VcRvc2),
      "vc_seed_vc" => Ok(Self::VcSeedVc),
      "vid_lipsync_face_fusion" => Ok(Self::VidLipsyncFaceFusion),
      "vid_lipsync_sad_talker" => Ok(Self::VidLipsyncSadTalker),
      "vid_live_portrait" => Ok(Self::VidLivePortrait),
      "vid_live_portrait_webcam" => Ok(Self::VidLivePortraitWebcam),
      "vid_studio" => Ok(Self::VidStudio),
      "vid_studio_gen2" => Ok(Self::VidStudioGen2),
      "vid_style_transfer" => Ok(Self::VidStyleTransfer),
      "lipsync_face_fusion" => Ok(Self::LipsyncFaceFusion),
      "lipsync_sad_talker" => Ok(Self::LipsyncSadTalker),
      "live_portrait" => Ok(Self::LivePortrait),
      "live_portrait_webcam" => Ok(Self::LivePortraitWebcam),
      "stable_diffusion" => Ok(Self::StableDiffusion),
      "studio" => Ok(Self::Studio),
      "vid_face_fusion" => Ok(Self::VidFaceFusion),
      "vst" => Ok(Self::Vst),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::DownloadGptSoVits,
      Self::FalImage,
      Self::FalVideo,
      Self::FalObject,
      Self::FalBgRemoval,
      Self::Seedance2ProVideo,
      Self::WorldlabsSplat,
      Self::TtsGptSoVits,
      Self::TtsStyleTts2,
      Self::TtsTacotron2,
      Self::TtsF5,
      Self::VcSeedVc,
      Self::VcSvc,
      Self::VcRvc2,
      Self::VidLipsyncFaceFusion,
      Self::VidLipsyncSadTalker,
      Self::VidLivePortrait,
      Self::VidLivePortraitWebcam,
      Self::VidStudio,
      Self::VidStudioGen2,
      Self::VidStyleTransfer,
      Self::LipsyncFaceFusion,
      Self::LipsyncSadTalker,
      Self::LivePortrait,
      Self::LivePortraitWebcam,
      Self::StableDiffusion,
      Self::Studio,
      Self::VidFaceFusion,
      Self::Vst,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::InferenceJobProductCategory;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in InferenceJobProductCategory::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: InferenceJobProductCategory = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
