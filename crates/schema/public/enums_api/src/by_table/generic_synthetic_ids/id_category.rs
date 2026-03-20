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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
