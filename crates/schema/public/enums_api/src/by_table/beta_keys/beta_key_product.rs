use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `batch_generations` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, ToSchema, EnumIter, Debug)]

pub enum BetaKeyProduct {
  /// Media files
  /// This will probably be the only type supported, but we'll leave the possibility of future types.
  #[serde(rename = "studio")]
  Studio,
}

#[cfg(test)]
mod tests {
  use super::BetaKeyProduct;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(BetaKeyProduct::Studio, "studio");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("studio", BetaKeyProduct::Studio);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(BetaKeyProduct::iter().count(), 1);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in BetaKeyProduct::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: BetaKeyProduct = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
