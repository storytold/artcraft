//! This is an important enum.
//!
//! Database version of GenerationProvider. Used in MySQL/SQLite queries.
//!
//! Do not change the values here without cause or care.

use enums_shared::error::enums_error::EnumsError;
use strum::EnumCount;
use strum::EnumIter;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum GenerationProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,
}

impl_enum_display_and_debug_using_to_str!(GenerationProvider);
impl_mysql_enum_coders!(GenerationProvider);
impl_mysql_from_row!(GenerationProvider);
impl_sqlite_enum_coders!(GenerationProvider);

impl GenerationProvider {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::Fal => "fal",
      Self::Grok => "grok",
      Self::Midjourney => "midjourney",
      Self::Sora => "sora",
      Self::WorldLabs => "world_labs",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumsError> {
    match value {
      "artcraft" => Ok(Self::Artcraft),
      "fal" => Ok(Self::Fal),
      "grok" => Ok(Self::Grok),
      "midjourney" => Ok(Self::Midjourney),
      "sora" => Ok(Self::Sora),
      "world_labs" => Ok(Self::WorldLabs),
      _ => Err(EnumsError::CouldNotConvertFromString(value.to_string())),
    }
  }

  // Conversion methods (from_db/to_db) live on the API type in enums_api,
  // since enums_api depends on enums_db (not the other way around).
}

#[cfg(test)]
mod tests {
  use super::GenerationProvider;
  use enums_shared::error::enums_error::EnumsError;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(GenerationProvider::Artcraft, "artcraft");
      assert_serialization(GenerationProvider::Fal, "fal");
      assert_serialization(GenerationProvider::Grok, "grok");
      assert_serialization(GenerationProvider::Midjourney, "midjourney");
      assert_serialization(GenerationProvider::Sora, "sora");
      assert_serialization(GenerationProvider::WorldLabs, "world_labs");
    }

    #[test]
    fn to_str() {
      assert_eq!(GenerationProvider::Artcraft.to_str(), "artcraft");
      assert_eq!(GenerationProvider::Fal.to_str(), "fal");
      assert_eq!(GenerationProvider::Grok.to_str(), "grok");
      assert_eq!(GenerationProvider::Midjourney.to_str(), "midjourney");
      assert_eq!(GenerationProvider::Sora.to_str(), "sora");
      assert_eq!(GenerationProvider::WorldLabs.to_str(), "world_labs");
    }

    #[test]
    fn from_str() {
      assert_eq!(GenerationProvider::from_str("artcraft").unwrap(), GenerationProvider::Artcraft);
      assert_eq!(GenerationProvider::from_str("fal").unwrap(), GenerationProvider::Fal);
      assert_eq!(GenerationProvider::from_str("grok").unwrap(), GenerationProvider::Grok);
      assert_eq!(GenerationProvider::from_str("midjourney").unwrap(), GenerationProvider::Midjourney);
      assert_eq!(GenerationProvider::from_str("sora").unwrap(), GenerationProvider::Sora);
      assert_eq!(GenerationProvider::from_str("world_labs").unwrap(), GenerationProvider::WorldLabs);
    }

    #[test]
    fn from_str_err() {
      let result = GenerationProvider::from_str("asdf");
      assert!(result.is_err());
      if let Err(EnumsError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumsError::CouldNotConvertFromString");
      }
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in GenerationProvider::iter() {
        assert_eq!(variant, GenerationProvider::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, GenerationProvider::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, GenerationProvider::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH: usize = 16; // TODO(bt): Confirm database column width, then remove this comment.
      for variant in GenerationProvider::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }

  // Conversion tests live in enums_api where from_db/to_db are defined.
}
