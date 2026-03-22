use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_synthetic_ids` table in `VARCHAR(32)` field `id_category`.
///
/// This lets us create synthetic increment IDs on a per-user, per-category basis.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum IdCategory {
  /// media_files table
  #[serde(rename = "media_file")]
  MediaFile,

  /// Results from lipsync animations (which may live in the media_files table)
  #[serde(rename = "lipsync_animation")]
  LipsyncAnimationResult,

  /// Results from face fusion
  #[serde(rename = "face_fusion")]
  FaceFusionResult,

  /// Results from video filters
  #[serde(rename = "video_filter")]
  VideoFilterResult,

  /// Results from Live Portrait
  #[serde(rename = "live_portrait")]
  LivePortraitResult,

  /// Studio Renders
  #[serde(rename = "studio_render")]
  StudioRender,

  /// Results from mocap
  #[serde(rename = "mocap")]
  MocapResult,

  /// Results from workflows
  #[serde(rename = "workflow")]
  WorkflowResult,

  /// Results from tacotron2
  /// Applies for RVC and SVC
  #[serde(rename = "tts_result")]
  TtsResult,

  /// Results from voice conversion (which may live in the media_files table)
  /// Applies for RVC and SVC
  #[serde(rename = "voice_conversion")]
  VoiceConversionResult,

  /// Results from the zero shot tts (which may live in the media_files table)
  #[serde(rename = "zs_tts_result")]
  ZeroShotTtsResult,

  /// Zs dataset which lives in the zs_voice_datasets table
  #[serde(rename = "zs_dataset")]
  ZeroShotVoiceDataset,

  /// Zs voice which lives in the zs_voices table
  #[serde(rename = "zs_voice")]
  ZeroShotVoiceEmbedding,

  #[serde(rename = "model_weights")]
  ModelWeights,

  /// Files that are uploaded with no general product area they belong to. (Eg. local dev testing)
  #[serde(rename = "file_upload")]
  FileUpload,
}

#[cfg(test)]
mod tests {
  use super::IdCategory;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(IdCategory::MediaFile, "media_file");
      assert_serialization(IdCategory::LipsyncAnimationResult, "lipsync_animation");
      assert_serialization(IdCategory::FaceFusionResult, "face_fusion");
      assert_serialization(IdCategory::VideoFilterResult, "video_filter");
      assert_serialization(IdCategory::LivePortraitResult, "live_portrait");
      assert_serialization(IdCategory::StudioRender, "studio_render");
      assert_serialization(IdCategory::MocapResult, "mocap");
      assert_serialization(IdCategory::WorkflowResult, "workflow");
      assert_serialization(IdCategory::TtsResult, "tts_result");
      assert_serialization(IdCategory::VoiceConversionResult, "voice_conversion");
      assert_serialization(IdCategory::ZeroShotTtsResult, "zs_tts_result");
      assert_serialization(IdCategory::ZeroShotVoiceDataset, "zs_dataset");
      assert_serialization(IdCategory::ZeroShotVoiceEmbedding, "zs_voice");
      assert_serialization(IdCategory::ModelWeights, "model_weights");
      assert_serialization(IdCategory::FileUpload, "file_upload");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("media_file", IdCategory::MediaFile);
      assert_deserialization("lipsync_animation", IdCategory::LipsyncAnimationResult);
      assert_deserialization("face_fusion", IdCategory::FaceFusionResult);
      assert_deserialization("video_filter", IdCategory::VideoFilterResult);
      assert_deserialization("live_portrait", IdCategory::LivePortraitResult);
      assert_deserialization("studio_render", IdCategory::StudioRender);
      assert_deserialization("mocap", IdCategory::MocapResult);
      assert_deserialization("workflow", IdCategory::WorkflowResult);
      assert_deserialization("tts_result", IdCategory::TtsResult);
      assert_deserialization("voice_conversion", IdCategory::VoiceConversionResult);
      assert_deserialization("zs_tts_result", IdCategory::ZeroShotTtsResult);
      assert_deserialization("zs_dataset", IdCategory::ZeroShotVoiceDataset);
      assert_deserialization("zs_voice", IdCategory::ZeroShotVoiceEmbedding);
      assert_deserialization("model_weights", IdCategory::ModelWeights);
      assert_deserialization("file_upload", IdCategory::FileUpload);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(IdCategory::iter().count(), 15);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in IdCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: IdCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
