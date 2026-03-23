use enums_shared::error::enums_error::EnumsError;
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

  pub fn from_str(value: &str) -> Result<Self, EnumsError> {
    match value {
      "artcraft_basic" => Ok(Self::ArtcraftBasic),
      "artcraft_pro" => Ok(Self::ArtcraftPro),
      "artcraft_max" => Ok(Self::ArtcraftMax),
      _ => Err(EnumsError::CouldNotConvertFromString(value.to_string())),
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

  mod from_str_checks {
    use super::*;

    #[test]
    fn from_str() {
      assert_eq!(ArtcraftSubscriptionSlug::from_str("artcraft_basic").unwrap(), ArtcraftSubscriptionSlug::ArtcraftBasic);
      assert_eq!(ArtcraftSubscriptionSlug::from_str("artcraft_pro").unwrap(), ArtcraftSubscriptionSlug::ArtcraftPro);
      assert_eq!(ArtcraftSubscriptionSlug::from_str("artcraft_max").unwrap(), ArtcraftSubscriptionSlug::ArtcraftMax);
    }

    #[test]
    fn from_str_invalid() {
      assert!(ArtcraftSubscriptionSlug::from_str("invalid").is_err());
      assert!(ArtcraftSubscriptionSlug::from_str("").is_err());
    }

    #[test]
    fn from_str_matches_serde() {
      for variant in ArtcraftSubscriptionSlug::iter() {
        let serde_str = serde_json::to_string(&variant).unwrap().replace('"', "");
        let from_str_result = ArtcraftSubscriptionSlug::from_str(&serde_str).unwrap();
        assert_eq!(variant, from_str_result);
      }
    }

    #[test]
    fn from_str_round_trips_with_to_str() {
      for variant in ArtcraftSubscriptionSlug::iter() {
        let s = variant.to_str();
        let back = ArtcraftSubscriptionSlug::from_str(s).unwrap();
        assert_eq!(variant, back);
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
