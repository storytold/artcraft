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
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceJobProductCategory::DownloadGptSoVits, "download_gpt_so_vits");
      assert_serialization(InferenceJobProductCategory::FalImage, "fal_image");
      assert_serialization(InferenceJobProductCategory::FalVideo, "fal_video");
      assert_serialization(InferenceJobProductCategory::FalObject, "fal_object");
      assert_serialization(InferenceJobProductCategory::FalBgRemoval, "fal_bg_removal");
      assert_serialization(InferenceJobProductCategory::Seedance2ProVideo, "seedance2pro_video");
      assert_serialization(InferenceJobProductCategory::WorldlabsSplat, "worldlabs_splat");
      assert_serialization(InferenceJobProductCategory::TtsGptSoVits, "tts_gpt_so_vits");
      assert_serialization(InferenceJobProductCategory::TtsF5, "tts_f5");
      assert_serialization(InferenceJobProductCategory::TtsStyleTts2, "tts_style_tts2");
      assert_serialization(InferenceJobProductCategory::TtsTacotron2, "tts_tacotron2");
      assert_serialization(InferenceJobProductCategory::VcRvc2, "vc_rvc2");
      assert_serialization(InferenceJobProductCategory::VcSvc, "vc_svc");
      assert_serialization(InferenceJobProductCategory::VcSeedVc, "vc_seed_vc");
      assert_serialization(InferenceJobProductCategory::VidLipsyncFaceFusion, "vid_lipsync_face_fusion");
      assert_serialization(InferenceJobProductCategory::VidLipsyncSadTalker, "vid_lipsync_sad_talker");
      assert_serialization(InferenceJobProductCategory::VidLivePortrait, "vid_live_portrait");
      assert_serialization(InferenceJobProductCategory::VidLivePortraitWebcam, "vid_live_portrait_webcam");
      assert_serialization(InferenceJobProductCategory::VidStudio, "vid_studio");
      assert_serialization(InferenceJobProductCategory::VidStudioGen2, "vid_studio_gen2");
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
    fn test_deserialization() {
      assert_deserialization("download_gpt_so_vits", InferenceJobProductCategory::DownloadGptSoVits);
      assert_deserialization("fal_image", InferenceJobProductCategory::FalImage);
      assert_deserialization("fal_video", InferenceJobProductCategory::FalVideo);
      assert_deserialization("fal_object", InferenceJobProductCategory::FalObject);
      assert_deserialization("fal_bg_removal", InferenceJobProductCategory::FalBgRemoval);
      assert_deserialization("seedance2pro_video", InferenceJobProductCategory::Seedance2ProVideo);
      assert_deserialization("worldlabs_splat", InferenceJobProductCategory::WorldlabsSplat);
      assert_deserialization("tts_gpt_so_vits", InferenceJobProductCategory::TtsGptSoVits);
      assert_deserialization("tts_f5", InferenceJobProductCategory::TtsF5);
      assert_deserialization("tts_style_tts2", InferenceJobProductCategory::TtsStyleTts2);
      assert_deserialization("tts_tacotron2", InferenceJobProductCategory::TtsTacotron2);
      assert_deserialization("vc_rvc2", InferenceJobProductCategory::VcRvc2);
      assert_deserialization("vc_svc", InferenceJobProductCategory::VcSvc);
      assert_deserialization("vc_seed_vc", InferenceJobProductCategory::VcSeedVc);
      assert_deserialization("vid_lipsync_face_fusion", InferenceJobProductCategory::VidLipsyncFaceFusion);
      assert_deserialization("vid_lipsync_sad_talker", InferenceJobProductCategory::VidLipsyncSadTalker);
      assert_deserialization("vid_live_portrait", InferenceJobProductCategory::VidLivePortrait);
      assert_deserialization("vid_live_portrait_webcam", InferenceJobProductCategory::VidLivePortraitWebcam);
      assert_deserialization("vid_studio", InferenceJobProductCategory::VidStudio);
      assert_deserialization("vid_studio_gen2", InferenceJobProductCategory::VidStudioGen2);
      assert_deserialization("vid_style_transfer", InferenceJobProductCategory::VidStyleTransfer);
      assert_deserialization("lipsync_face_fusion", InferenceJobProductCategory::LipsyncFaceFusion);
      assert_deserialization("lipsync_sad_talker", InferenceJobProductCategory::LipsyncSadTalker);
      assert_deserialization("live_portrait", InferenceJobProductCategory::LivePortrait);
      assert_deserialization("live_portrait_webcam", InferenceJobProductCategory::LivePortraitWebcam);
      assert_deserialization("stable_diffusion", InferenceJobProductCategory::StableDiffusion);
      assert_deserialization("studio", InferenceJobProductCategory::Studio);
      assert_deserialization("vid_face_fusion", InferenceJobProductCategory::VidFaceFusion);
      assert_deserialization("vst", InferenceJobProductCategory::Vst);
    }

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
