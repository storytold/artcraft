use strum::EnumIter;
use utoipa::ToSchema;

/// Common video resolutions.
/// Mirrors artcraft_router::api::common_resolution::CommonResolution.
#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize, ToSchema, EnumIter)]
#[serde(rename_all = "snake_case")]
pub enum CommonVideoResolution {
  OneK,
  TwoK,
  ThreeK,
  FourK,
}

#[cfg(test)]
mod tests {
  use super::CommonVideoResolution;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonVideoResolution::OneK, "one_k");
      assert_serialization(CommonVideoResolution::TwoK, "two_k");
      assert_serialization(CommonVideoResolution::ThreeK, "three_k");
      assert_serialization(CommonVideoResolution::FourK, "four_k");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("one_k", CommonVideoResolution::OneK);
      assert_deserialization("two_k", CommonVideoResolution::TwoK);
      assert_deserialization("three_k", CommonVideoResolution::ThreeK);
      assert_deserialization("four_k", CommonVideoResolution::FourK);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(CommonVideoResolution::iter().count(), 4);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in CommonVideoResolution::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: CommonVideoResolution = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
