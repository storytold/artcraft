use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum PaymentsNamespace {
  #[serde(rename = "artcraft")]
  Artcraft,
  #[serde(rename = "fakeyou")]
  FakeYou,
}

#[cfg(test)]
mod tests {
  use super::PaymentsNamespace;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PaymentsNamespace::Artcraft, "artcraft");
      assert_serialization(PaymentsNamespace::FakeYou, "fakeyou");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("artcraft", PaymentsNamespace::Artcraft);
      assert_deserialization("fakeyou", PaymentsNamespace::FakeYou);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(PaymentsNamespace::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in PaymentsNamespace::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: PaymentsNamespace = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
