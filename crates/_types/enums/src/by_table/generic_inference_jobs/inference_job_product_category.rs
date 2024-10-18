use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `product_category`.
///
/// This is a user-facing and analytics-facing column that describes what product area the job
/// is attributed to. For example, this will help us separate "video style transfer" from
/// "storyteller studio" and also separate "live portrait" from "webcam live portrait".
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum InferenceJobProductCategory {
  // =============== DOWNLOAD ===============

  /// Download: GptSoVits
  #[default]
  DownloadGptSoVits,

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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceJobProductCategory);
impl_mysql_enum_coders!(InferenceJobProductCategory);

/// NB: Legacy API for older code.
impl InferenceJobProductCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::DownloadGptSoVits => "download_gpt_so_vits",
      Self::TtsGptSoVits => "tts_gpt_so_vits",
      Self::TtsStyleTts2 => "tts_style_tts2",
      Self::TtsTacotron2 => "tts_tacotron2",
      Self::TtsF5 => "tts_f5",
      Self::VcSvc => "vc_svc",
      Self::VcRvc2 => "vc_rvc2",
      Self::VidLipsyncFaceFusion => "vid_lipsync_face_fusion",
      Self::VidLipsyncSadTalker => "vid_lipsync_sad_talker",
      Self::VidLivePortrait => "vid_live_portrait",
      Self::VidLivePortraitWebcam => "vid_live_portrait_webcam",
      Self::VidStudio => "vid_studio",
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
      "tts_gpt_so_vits" => Ok(Self::TtsGptSoVits),
      "tts_style_tts2" => Ok(Self::TtsStyleTts2),
      "tts_tacotron2" => Ok(Self::TtsTacotron2),
      "tts_f5" => Ok(Self::TtsF5),
      "vc_svc" => Ok(Self::VcSvc),
      "vc_rvc2" => Ok(Self::VcRvc2),
      "vid_lipsync_face_fusion" => Ok(Self::VidLipsyncFaceFusion),
      "vid_lipsync_sad_talker" => Ok(Self::VidLipsyncSadTalker),
      "vid_live_portrait" => Ok(Self::VidLivePortrait),
      "vid_live_portrait_webcam" => Ok(Self::VidLivePortraitWebcam),
      "vid_studio" => Ok(Self::VidStudio),
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
      Self::TtsGptSoVits,
      Self::TtsStyleTts2,
      Self::TtsTacotron2,
      Self::TtsF5,
      Self::VcSvc,
      Self::VcRvc2,
      Self::VidLipsyncFaceFusion,
      Self::VidLipsyncSadTalker,
      Self::VidLivePortrait,
      Self::VidLivePortraitWebcam,
      Self::VidStudio,
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
  use crate::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceJobProductCategory::DownloadGptSoVits, "download_gpt_so_vits");
      assert_serialization(InferenceJobProductCategory::TtsGptSoVits, "tts_gpt_so_vits");
      assert_serialization(InferenceJobProductCategory::TtsStyleTts2, "tts_style_tts2");
      assert_serialization(InferenceJobProductCategory::TtsTacotron2, "tts_tacotron2");
      assert_serialization(InferenceJobProductCategory::TtsF5, "tts_f5");
      assert_serialization(InferenceJobProductCategory::VcRvc2, "vc_rvc2");
      assert_serialization(InferenceJobProductCategory::VcSvc, "vc_svc");
      assert_serialization(InferenceJobProductCategory::VidLipsyncFaceFusion, "vid_lipsync_face_fusion");
      assert_serialization(InferenceJobProductCategory::VidLipsyncSadTalker, "vid_lipsync_sad_talker");
      assert_serialization(InferenceJobProductCategory::VidLivePortrait, "vid_live_portrait");
      assert_serialization(InferenceJobProductCategory::VidLivePortraitWebcam, "vid_live_portrait_webcam");
      assert_serialization(InferenceJobProductCategory::VidStudio, "vid_studio");
      assert_serialization(InferenceJobProductCategory::VidStyleTransfer, "vid_style_transfer");
      assert_serialization(InferenceJobProductCategory::LipsyncFaceFusion, "lipsync_face_fusion");
      assert_serialization(InferenceJobProductCategory::LipsyncSadTalker, "lipsync_sad_talker");
      assert_serialization(InferenceJobProductCategory::LivePortrait, "live_portrait");
      assert_serialization(InferenceJobProductCategory::LivePortraitWebcam, "live_portrait_webcam");
      assert_serialization(InferenceJobProductCategory::StableDiffusion, "stable_diffusion");
      assert_serialization(InferenceJobProductCategory::Studio, "studio");
      assert_serialization(InferenceJobProductCategory::VidFaceFusion, "vid_face_fusion");
      assert_serialization(InferenceJobProductCategory::Vst, "vst");
    }

    #[test]
    fn to_str() {
      assert_eq!(InferenceJobProductCategory::DownloadGptSoVits.to_str(), "download_gpt_so_vits");
      assert_eq!(InferenceJobProductCategory::TtsGptSoVits.to_str(), "tts_gpt_so_vits");
      assert_eq!(InferenceJobProductCategory::TtsStyleTts2.to_str(), "tts_style_tts2");
      assert_eq!(InferenceJobProductCategory::TtsTacotron2.to_str(), "tts_tacotron2");
      assert_eq!(InferenceJobProductCategory::VcRvc2.to_str(), "vc_rvc2");
      assert_eq!(InferenceJobProductCategory::VcSvc.to_str(), "vc_svc");
      assert_eq!(InferenceJobProductCategory::VidLipsyncFaceFusion.to_str(), "vid_lipsync_face_fusion");
      assert_eq!(InferenceJobProductCategory::VidLipsyncSadTalker.to_str(), "vid_lipsync_sad_talker");
      assert_eq!(InferenceJobProductCategory::VidLivePortrait.to_str(), "vid_live_portrait");
      assert_eq!(InferenceJobProductCategory::VidLivePortraitWebcam.to_str(), "vid_live_portrait_webcam");
      assert_eq!(InferenceJobProductCategory::VidStudio.to_str(), "vid_studio");
      assert_eq!(InferenceJobProductCategory::VidStyleTransfer.to_str(), "vid_style_transfer");
      assert_eq!(InferenceJobProductCategory::LipsyncFaceFusion.to_str(), "lipsync_face_fusion");
      assert_eq!(InferenceJobProductCategory::LipsyncSadTalker.to_str(), "lipsync_sad_talker");
      assert_eq!(InferenceJobProductCategory::LivePortrait.to_str(), "live_portrait");
      assert_eq!(InferenceJobProductCategory::LivePortraitWebcam.to_str(), "live_portrait_webcam");
      assert_eq!(InferenceJobProductCategory::StableDiffusion.to_str(), "stable_diffusion");
      assert_eq!(InferenceJobProductCategory::Studio.to_str(), "studio");
      assert_eq!(InferenceJobProductCategory::VidFaceFusion.to_str(), "vid_face_fusion");
      assert_eq!(InferenceJobProductCategory::Vst.to_str(), "vst");
    }

    #[test]
    fn from_str() {
      assert_eq!(InferenceJobProductCategory::from_str("download_gpt_so_vits").unwrap(), InferenceJobProductCategory::DownloadGptSoVits);
      assert_eq!(InferenceJobProductCategory::from_str("tts_gpt_so_vits").unwrap(), InferenceJobProductCategory::TtsGptSoVits);
      assert_eq!(InferenceJobProductCategory::from_str("tts_style_tts2").unwrap(), InferenceJobProductCategory::TtsStyleTts2);
      assert_eq!(InferenceJobProductCategory::from_str("tts_tacotron2").unwrap(), InferenceJobProductCategory::TtsTacotron2);
      assert_eq!(InferenceJobProductCategory::from_str("vc_rvc2").unwrap(), InferenceJobProductCategory::VcRvc2);
      assert_eq!(InferenceJobProductCategory::from_str("vc_svc").unwrap(), InferenceJobProductCategory::VcSvc);
      assert_eq!(InferenceJobProductCategory::from_str("vid_lipsync_face_fusion").unwrap(), InferenceJobProductCategory::VidLipsyncFaceFusion);
      assert_eq!(InferenceJobProductCategory::from_str("vid_lipsync_sad_talker").unwrap(), InferenceJobProductCategory::VidLipsyncSadTalker);
      assert_eq!(InferenceJobProductCategory::from_str("vid_live_portrait").unwrap(), InferenceJobProductCategory::VidLivePortrait);
      assert_eq!(InferenceJobProductCategory::from_str("vid_live_portrait_webcam").unwrap(), InferenceJobProductCategory::VidLivePortraitWebcam);
      assert_eq!(InferenceJobProductCategory::from_str("vid_studio").unwrap(), InferenceJobProductCategory::VidStudio);
      assert_eq!(InferenceJobProductCategory::from_str("vid_style_transfer").unwrap(), InferenceJobProductCategory::VidStyleTransfer);
      assert_eq!(InferenceJobProductCategory::from_str("lipsync_face_fusion").unwrap(), InferenceJobProductCategory::LipsyncFaceFusion);
      assert_eq!(InferenceJobProductCategory::from_str("lipsync_sad_talker").unwrap(), InferenceJobProductCategory::LipsyncSadTalker);
      assert_eq!(InferenceJobProductCategory::from_str("live_portrait").unwrap(), InferenceJobProductCategory::LivePortrait);
      assert_eq!(InferenceJobProductCategory::from_str("live_portrait_webcam").unwrap(), InferenceJobProductCategory::LivePortraitWebcam);
      assert_eq!(InferenceJobProductCategory::from_str("stable_diffusion").unwrap(), InferenceJobProductCategory::StableDiffusion);
      assert_eq!(InferenceJobProductCategory::from_str("studio").unwrap(), InferenceJobProductCategory::Studio);
      assert_eq!(InferenceJobProductCategory::from_str("vid_face_fusion").unwrap(), InferenceJobProductCategory::VidFaceFusion);
      assert_eq!(InferenceJobProductCategory::from_str("vst").unwrap(), InferenceJobProductCategory::Vst);
    }

    #[test]
    fn all_variants() {
      // Static check
      let mut variants = InferenceJobProductCategory::all_variants();
      assert_eq!(variants.len(), 20);
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::DownloadGptSoVits));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::TtsGptSoVits));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::TtsStyleTts2));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::TtsTacotron2));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VcRvc2));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VcSvc));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VidLipsyncFaceFusion));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VidLipsyncSadTalker));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VidLivePortrait));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VidLivePortraitWebcam));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VidStudio));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VidStyleTransfer));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::LipsyncFaceFusion));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::LipsyncSadTalker));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::LivePortrait));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::LivePortraitWebcam));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::StableDiffusion));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::Studio));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::VidFaceFusion));
      assert_eq!(variants.pop_first(), Some(InferenceJobProductCategory::Vst));
      assert_eq!(variants.pop_first(), None);

      // Generated check
      use strum::IntoEnumIterator;
      assert_eq!(InferenceJobProductCategory::all_variants().len(), InferenceJobProductCategory::iter().len());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(InferenceJobProductCategory::all_variants().len(), InferenceJobProductCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in InferenceJobProductCategory::all_variants() {
        assert_eq!(variant, InferenceJobProductCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceJobProductCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceJobProductCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in InferenceJobProductCategory::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
