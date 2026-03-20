use strum::EnumIter;
use utoipa::ToSchema;

/// Splat models available for generation.
/// Mirrors artcraft_router::api::common_splat_model::CommonSplatModel.
#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize, ToSchema, EnumIter)]
#[serde(rename_all = "snake_case")]
pub enum CommonSplatModel {
  #[serde(rename = "marble_0p1_mini")]
  Marble0p1Mini,

  #[serde(rename = "marble_0p1_plus")]
  Marble0p1Plus,
}

#[cfg(test)]
mod tests {
  use super::CommonSplatModel;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonSplatModel::Marble0p1Mini, "marble_0p1_mini");
      assert_serialization(CommonSplatModel::Marble0p1Plus, "marble_0p1_plus");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("marble_0p1_mini", CommonSplatModel::Marble0p1Mini);
      assert_deserialization("marble_0p1_plus", CommonSplatModel::Marble0p1Plus);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(CommonSplatModel::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in CommonSplatModel::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: CommonSplatModel = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
