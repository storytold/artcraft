use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `voice_conversion_results` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum VoiceConversionMediaTokenType {
  /// Media token refers to record in `media_uploads` table.
  MediaUpload,
}

#[cfg(test)]
mod tests {
  use super::VoiceConversionMediaTokenType;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(VoiceConversionMediaTokenType::iter().count(), 1);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in VoiceConversionMediaTokenType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: VoiceConversionMediaTokenType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
