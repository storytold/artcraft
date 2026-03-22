use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum ArtcraftSubscriptionSlug {
  ArtcraftBasic,
  ArtcraftPro,
  ArtcraftMax,
}

impl ArtcraftSubscriptionSlug {
  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::ArtcraftBasic => "artcraft_basic",
      Self::ArtcraftPro => "artcraft_pro",
      Self::ArtcraftMax => "artcraft_max",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::ArtcraftSubscriptionSlug;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ArtcraftSubscriptionSlug::ArtcraftBasic, "artcraft_basic");
      assert_serialization(ArtcraftSubscriptionSlug::ArtcraftPro, "artcraft_pro");
      assert_serialization(ArtcraftSubscriptionSlug::ArtcraftMax, "artcraft_max");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("artcraft_basic", ArtcraftSubscriptionSlug::ArtcraftBasic);
      assert_deserialization("artcraft_pro", ArtcraftSubscriptionSlug::ArtcraftPro);
      assert_deserialization("artcraft_max", ArtcraftSubscriptionSlug::ArtcraftMax);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ArtcraftSubscriptionSlug::iter().count(), 3);
    }
  }

  mod to_str_checks {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(ArtcraftSubscriptionSlug::ArtcraftBasic.to_str(), "artcraft_basic");
      assert_eq!(ArtcraftSubscriptionSlug::ArtcraftPro.to_str(), "artcraft_pro");
      assert_eq!(ArtcraftSubscriptionSlug::ArtcraftMax.to_str(), "artcraft_max");
    }

    #[test]
    fn to_str_matches_serde() {
      for variant in ArtcraftSubscriptionSlug::iter() {
        let serde_str = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert_eq!(variant.to_str(), serde_str);
      }
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ArtcraftSubscriptionSlug::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ArtcraftSubscriptionSlug = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
