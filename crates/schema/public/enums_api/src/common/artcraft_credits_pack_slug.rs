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

impl ArtcraftCreditsPackSlug {
  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft1000 => "artcraft_1000",
      Self::Artcraft2500 => "artcraft_2500",
      Self::Artcraft5000 => "artcraft_5000",
      Self::Artcraft10000 => "artcraft_10000",
      Self::Artcraft25000 => "artcraft_25000",
      Self::Artcraft50000 => "artcraft_50000",
    }
  }
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

  mod to_str_checks {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft1000.to_str(), "artcraft_1000");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft2500.to_str(), "artcraft_2500");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft5000.to_str(), "artcraft_5000");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft10000.to_str(), "artcraft_10000");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft25000.to_str(), "artcraft_25000");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft50000.to_str(), "artcraft_50000");
    }

    #[test]
    fn to_str_matches_serde() {
      for variant in ArtcraftCreditsPackSlug::iter() {
        let serde_str = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert_eq!(variant.to_str(), serde_str);
      }
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
