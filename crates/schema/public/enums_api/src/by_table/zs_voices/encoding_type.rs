use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `encoding_type`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum ZsVoiceEncodingType {
  /// Encodec features
  #[serde(rename = "encodec")]
  Encodec,
}

#[cfg(test)]
mod tests {
  use super::ZsVoiceEncodingType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceEncodingType::Encodec, "encodec");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("encodec", ZsVoiceEncodingType::Encodec);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ZsVoiceEncodingType::iter().count(), 1);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ZsVoiceEncodingType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ZsVoiceEncodingType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
