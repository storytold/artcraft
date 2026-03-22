use strum::EnumCount;
use strum::EnumIter;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, EnumIter, EnumCount)]
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

impl_enum_display_and_debug_using_to_str!(ArtcraftCreditsPackSlug);
impl_mysql_enum_coders!(ArtcraftCreditsPackSlug);
impl_mysql_from_row!(ArtcraftCreditsPackSlug);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl ArtcraftCreditsPackSlug {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft1000 => "artcraft_1000",
      Self::Artcraft2500 => "artcraft_2500",
      Self::Artcraft5000 => "artcraft_5000",
      Self::Artcraft10000 => "artcraft_10000",
      Self::Artcraft25000 => "artcraft_25000",
      Self::Artcraft50000 => "artcraft_50000",
    }
  }

  pub fn from_str(s: &str) -> Result<Self, String> {
    match s {
      "artcraft_1000" => Ok(Self::Artcraft1000),
      "artcraft_2500" => Ok(Self::Artcraft2500),
      "artcraft_5000" => Ok(Self::Artcraft5000),
      "artcraft_10000" => Ok(Self::Artcraft10000),
      "artcraft_25000" => Ok(Self::Artcraft25000),
      "artcraft_50000" => Ok(Self::Artcraft50000),
      _ => Err(format!("invalid artcraft_credits_pack_slug: {:?}", s)),
    }
  }

}

#[cfg(test)]
mod tests {
  use enums_shared::test_helpers::assert_serialization;
  use super::ArtcraftCreditsPackSlug;

  mod explicit_checks {
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
    fn to_str() {
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft1000.to_str(), "artcraft_1000");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft2500.to_str(), "artcraft_2500");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft5000.to_str(), "artcraft_5000");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft10000.to_str(), "artcraft_10000");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft25000.to_str(), "artcraft_25000");
      assert_eq!(ArtcraftCreditsPackSlug::Artcraft50000.to_str(), "artcraft_50000");
    }

    #[test]
    fn from_str() {
      assert_eq!(ArtcraftCreditsPackSlug::from_str("artcraft_1000").unwrap(), ArtcraftCreditsPackSlug::Artcraft1000);
      assert_eq!(ArtcraftCreditsPackSlug::from_str("artcraft_2500").unwrap(), ArtcraftCreditsPackSlug::Artcraft2500);
      assert_eq!(ArtcraftCreditsPackSlug::from_str("artcraft_5000").unwrap(), ArtcraftCreditsPackSlug::Artcraft5000);
      assert_eq!(ArtcraftCreditsPackSlug::from_str("artcraft_10000").unwrap(), ArtcraftCreditsPackSlug::Artcraft10000);
      assert_eq!(ArtcraftCreditsPackSlug::from_str("artcraft_25000").unwrap(), ArtcraftCreditsPackSlug::Artcraft25000);
      assert_eq!(ArtcraftCreditsPackSlug::from_str("artcraft_50000").unwrap(), ArtcraftCreditsPackSlug::Artcraft50000);

    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in ArtcraftCreditsPackSlug::iter() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, ArtcraftCreditsPackSlug::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ArtcraftCreditsPackSlug::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ArtcraftCreditsPackSlug::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in ArtcraftCreditsPackSlug::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
