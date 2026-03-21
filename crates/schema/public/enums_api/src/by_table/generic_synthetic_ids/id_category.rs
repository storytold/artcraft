use std::collections::BTreeSet;

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

/// NB: Legacy API for older code.
impl IdCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
      Self::LipsyncAnimationResult => "lipsync_animation",
      Self::FaceFusionResult => "face_fusion",
      Self::TtsResult => "tts_result",
      Self::VoiceConversionResult => "voice_conversion",
      Self::ZeroShotVoiceDataset => "zs_dataset",
      Self::ZeroShotVoiceEmbedding => "zs_voice",
      Self::ZeroShotTtsResult => "zs_tts_result",
      Self::VideoFilterResult => "video_filter",
      Self::LivePortraitResult => "live_portrait",
      Self::StudioRender => "studio_render",
      Self::ModelWeights => "model_weights",
      Self::FileUpload => "file_upload",
      Self::MocapResult => "mocap",
      Self::WorkflowResult => "workflow",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      "lipsync_animation" => Ok(Self::LipsyncAnimationResult),
      "face_fusion" => Ok(Self::FaceFusionResult),
      "tts_result" => Ok(Self::TtsResult),
      "voice_conversion" => Ok(Self::VoiceConversionResult),
      "zs_dataset" => Ok(Self::ZeroShotVoiceDataset),
      "zs_voice" => Ok(Self::ZeroShotVoiceEmbedding),
      "zs_tts_result" => Ok(Self::ZeroShotTtsResult),
      "video_filter" => Ok(Self::VideoFilterResult),
      "live_portrait" => Ok(Self::LivePortraitResult),
      "studio_render" => Ok(Self::StudioRender),
      "model_weights" => Ok(Self::ModelWeights),
      "file_upload" => Ok(Self::FileUpload),
      "mocap" => Ok(Self::MocapResult),
      "workflow" => Ok(Self::WorkflowResult),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::MediaFile,
      Self::LipsyncAnimationResult,
      Self::FaceFusionResult,
      Self::VideoFilterResult,
      Self::LivePortraitResult,
      Self::StudioRender,
      Self::TtsResult,
      Self::VoiceConversionResult,
      Self::ZeroShotTtsResult,
      Self::ZeroShotVoiceDataset,
      Self::ZeroShotVoiceEmbedding,
      Self::ModelWeights,
      Self::FileUpload,
      Self::MocapResult,
      Self::WorkflowResult,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::IdCategory;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in IdCategory::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: IdCategory = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
