use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum ArtcraftCreditsPackSlug {
  #[serde(rename= "artcraft_1000")]
  Artcraft1000,
  #[serde(rename= "artcraft_2500")]
  Artcraft2500,
  #[serde(rename= "artcraft_5000")]
  Artcraft5000,
  #[serde(rename= "artcraft_10000")]
  Artcraft10000,
  #[serde(rename= "artcraft_25000")]
  Artcraft25000,
  #[serde(rename= "artcraft_50000")]
  Artcraft50000,
}

#[cfg(test)]
mod tests {
  use super::ArtcraftCreditsPackSlug;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ArtcraftCreditsPackSlug::Artcraft1000, "artcraft_1000");
      assert_serialization(ArtcraftCreditsPackSlug::Artcraft2500, "artcraft_2500");
      assert_serialization(ArtcraftCreditsPackSlug::Artcraft5000, "artcraft_5000");
      assert_serialization(ArtcraftCreditsPackSlug::Artcraft10000, "artcraft_10000");
      assert_serialization(ArtcraftCreditsPackSlug::Artcraft25000, "artcraft_25000");
      assert_serialization(ArtcraftCreditsPackSlug::Artcraft50000, "artcraft_50000");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("artcraft_1000", ArtcraftCreditsPackSlug::Artcraft1000);
      assert_deserialization("artcraft_2500", ArtcraftCreditsPackSlug::Artcraft2500);
      assert_deserialization("artcraft_5000", ArtcraftCreditsPackSlug::Artcraft5000);
      assert_deserialization("artcraft_10000", ArtcraftCreditsPackSlug::Artcraft10000);
      assert_deserialization("artcraft_25000", ArtcraftCreditsPackSlug::Artcraft25000);
      assert_deserialization("artcraft_50000", ArtcraftCreditsPackSlug::Artcraft50000);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ArtcraftCreditsPackSlug::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ArtcraftCreditsPackSlug::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ArtcraftCreditsPackSlug = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
