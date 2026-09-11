use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `characters` table in `VARCHAR(24)` field `character_type`.
///
/// Identifies the type/backend used to create the character.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum CharacterType {
  /// Character created via Kinovi / Seedance2Pro.
  #[serde(rename = "kinovi_seedance")]
  KinoviSeedance,
}

impl_enum_display_and_debug_using_to_str!(CharacterType);
impl_mysql_enum_coders!(CharacterType);

impl CharacterType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::KinoviSeedance => "kinovi_seedance",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "kinovi_seedance" => Ok(Self::KinoviSeedance),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::KinoviSeedance,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::characters::character_type::CharacterType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(CharacterType::KinoviSeedance, "kinovi_seedance");
    }

    #[test]
    fn to_str() {
      assert_eq!(CharacterType::KinoviSeedance.to_str(), "kinovi_seedance");
    }

    #[test]
    fn from_str() {
      assert_eq!(CharacterType::from_str("kinovi_seedance").unwrap(), CharacterType::KinoviSeedance);
      assert!(CharacterType::from_str("invalid").is_err());
    }

    #[test]
    fn all_variants() {
      const EXPECTED_COUNT: usize = 1;

      assert_eq!(CharacterType::all_variants().len(), EXPECTED_COUNT);

      use strum::IntoEnumIterator;
      assert_eq!(CharacterType::all_variants().len(), CharacterType::iter().len());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CharacterType::all_variants().len(), CharacterType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CharacterType::all_variants() {
        assert_eq!(variant, CharacterType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CharacterType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CharacterType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 24;
      for variant in CharacterType::all_variants() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long for VARCHAR({})", variant, MAX_LENGTH);
      }
    }
  }
}
