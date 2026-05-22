//! This is an important enum.
//!
//! It's used in storyteller-web inference generation, the cost estimate handler,
//! the ArtCraft Tauri app, and more.
//!
//! Do not change the values here without cause or care.

use std::collections::BTreeSet;

use crate::error::enum_error::EnumError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
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

// For Tauri
impl_sqlite_enum_coders!(GenerationProvider);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

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

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "artcraft" => Ok(Self::Artcraft),
      "fal" => Ok(Self::Fal),
      "grok" => Ok(Self::Grok),
      "midjourney" => Ok(Self::Midjourney),
      "sora" => Ok(Self::Sora),
      "world_labs" => Ok(Self::WorldLabs),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Artcraft,
      Self::Fal,
      Self::Grok,
      Self::Midjourney,
      Self::Sora,
      Self::WorldLabs,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation_provider::GenerationProvider;
  use crate::error::enum_error::EnumError;
  use crate::test_helpers::assert_serialization;

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
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = GenerationProvider::all_variants();
      assert_eq!(variants.len(), 6);
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Artcraft));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Fal));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Grok));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Midjourney));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Sora));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::WorldLabs));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(GenerationProvider::all_variants().len(), GenerationProvider::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in GenerationProvider::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, GenerationProvider::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, GenerationProvider::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, GenerationProvider::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in GenerationProvider::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
