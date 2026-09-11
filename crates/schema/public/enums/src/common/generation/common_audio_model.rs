use utoipa::ToSchema;

/// Audio models available for generation.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonAudioModel {
  #[serde(rename = "suno_music")]
  SunoMusic,

  #[serde(rename = "suno_remix")]
  SunoRemix,

  #[serde(rename = "suno_sounds")]
  SunoSounds,

  #[serde(rename = "suno_sample")]
  SunoSample,

  #[serde(rename = "seed_audio_1p0")]
  SeedAudio1p0,
}

impl CommonAudioModel {
  pub fn to_common_model_type(&self) -> crate::common::generation::common_model_type::CommonModelType {
    use crate::common::generation::common_model_type::CommonModelType;
    match self {
      Self::SunoMusic => CommonModelType::SunoMusic,
      Self::SunoRemix => CommonModelType::SunoRemix,
      Self::SunoSounds => CommonModelType::SunoSounds,
      Self::SunoSample => CommonModelType::SunoSample,
      Self::SeedAudio1p0 => CommonModelType::SeedAudio1p0,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::common::generation::common_model_type::CommonModelType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonAudioModel::SunoMusic, "suno_music");
    assert_serialization(CommonAudioModel::SunoRemix, "suno_remix");
    assert_serialization(CommonAudioModel::SunoSounds, "suno_sounds");
    assert_serialization(CommonAudioModel::SunoSample, "suno_sample");
    assert_serialization(CommonAudioModel::SeedAudio1p0, "seed_audio_1p0");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("suno_music", CommonAudioModel::SunoMusic),
      ("suno_remix", CommonAudioModel::SunoRemix),
      ("suno_sounds", CommonAudioModel::SunoSounds),
      ("suno_sample", CommonAudioModel::SunoSample),
      ("seed_audio_1p0", CommonAudioModel::SeedAudio1p0),
    ];
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonAudioModel = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    let all = [
      CommonAudioModel::SunoMusic,
      CommonAudioModel::SunoRemix,
      CommonAudioModel::SunoSounds,
      CommonAudioModel::SunoSample,
      CommonAudioModel::SeedAudio1p0,
    ];
    for variant in all {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: CommonAudioModel = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized, "Round-trip failed for {:?}", variant);
    }
  }

  #[test]
  fn all_audio_models_convert_to_common_model_type() {
    let models = [
      (CommonAudioModel::SunoMusic, CommonModelType::SunoMusic),
      (CommonAudioModel::SunoRemix, CommonModelType::SunoRemix),
      (CommonAudioModel::SunoSounds, CommonModelType::SunoSounds),
      (CommonAudioModel::SunoSample, CommonModelType::SunoSample),
      (CommonAudioModel::SeedAudio1p0, CommonModelType::SeedAudio1p0),
    ];
    for (audio_model, expected) in models {
      assert_eq!(audio_model.to_common_model_type(), expected);
    }
  }
}
