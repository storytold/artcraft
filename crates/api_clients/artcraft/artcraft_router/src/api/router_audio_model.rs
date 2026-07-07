use serde_derive::{Deserialize, Serialize};

/// Common audio models supported by the router.
/// Not all models are available through all providers.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RouterAudioModel {
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

#[cfg(test)]
mod tests {
  use super::*;

  // NB: These strings must match `CommonAudioModel` — the two enums convert
  // via serde string round-trip.
  #[test]
  fn all_variants_serialize_to_common_audio_model_strings() {
    assert_serde_round_trip(RouterAudioModel::SunoMusic, "suno_music");
    assert_serde_round_trip(RouterAudioModel::SunoRemix, "suno_remix");
    assert_serde_round_trip(RouterAudioModel::SunoSounds, "suno_sounds");
    assert_serde_round_trip(RouterAudioModel::SunoSample, "suno_sample");
    assert_serde_round_trip(RouterAudioModel::SeedAudio1p0, "seed_audio_1p0");
  }

  #[test]
  fn round_trips_through_common_audio_model() {
    use enums::common::generation::common_audio_model::CommonAudioModel;

    let cases = [
      (RouterAudioModel::SunoMusic, CommonAudioModel::SunoMusic),
      (RouterAudioModel::SunoRemix, CommonAudioModel::SunoRemix),
      (RouterAudioModel::SunoSounds, CommonAudioModel::SunoSounds),
      (RouterAudioModel::SunoSample, CommonAudioModel::SunoSample),
      (RouterAudioModel::SeedAudio1p0, CommonAudioModel::SeedAudio1p0),
    ];
    for (router_model, expected_common) in cases {
      let json = serde_json::to_string(&router_model).unwrap();
      let common: CommonAudioModel = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("CommonAudioModel failed to parse {json}: {e}"));
      assert_eq!(common, expected_common, "for {router_model:?}");
    }
  }

  fn assert_serde_round_trip(model: RouterAudioModel, expected: &str) {
    let json = serde_json::to_string(&model).unwrap();
    assert_eq!(json, format!("\"{expected}\""));
    let parsed: RouterAudioModel = serde_json::from_str(&json).unwrap();
    // RouterAudioModel isn't PartialEq, so round-trip back to the wire form.
    assert_eq!(serde_json::to_string(&parsed).unwrap(), json);
  }
}
