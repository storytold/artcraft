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

#[cfg(test)]
mod tests {
  use super::InferenceJobProductCategory;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(InferenceJobProductCategory::iter().count(), 29);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in InferenceJobProductCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: InferenceJobProductCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
