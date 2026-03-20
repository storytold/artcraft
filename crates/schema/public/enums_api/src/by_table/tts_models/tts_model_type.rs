use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `tts_models` table in an `ENUM` field.
/// -- Furthermore -- not all enum values are represented !!
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum TtsModelType {
  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "vits")]
  Vits,
}

#[cfg(test)]
mod tests {
  use super::TtsModelType;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(TtsModelType::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TtsModelType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TtsModelType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
