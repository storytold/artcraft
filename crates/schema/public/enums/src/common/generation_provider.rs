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
  Higgsfield,
  Krea,
  Leonardo,
  Magnific,
  Openart,
  Picsart,
  Pixverse,
  Runway,
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
      Self::Higgsfield => "higgsfield",
      Self::Krea => "krea",
      Self::Leonardo => "leonardo",
      Self::Magnific => "magnific",
      Self::Openart => "openart",
      Self::Picsart => "picsart",
      Self::Pixverse => "pixverse",
      Self::Runway => "runway",
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
      "higgsfield" => Ok(Self::Higgsfield),
      "krea" => Ok(Self::Krea),
      "leonardo" => Ok(Self::Leonardo),
      "magnific" => Ok(Self::Magnific),
      "openart" => Ok(Self::Openart),
      "picsart" => Ok(Self::Picsart),
      "pixverse" => Ok(Self::Pixverse),
      "runway" => Ok(Self::Runway),
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
      Self::Higgsfield,
      Self::Krea,
      Self::Leonardo,
      Self::Magnific,
      Self::Openart,
      Self::Picsart,
      Self::Pixverse,
      Self::Runway,
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
      assert_serialization(GenerationProvider::Higgsfield, "higgsfield");
      assert_serialization(GenerationProvider::Krea, "krea");
      assert_serialization(GenerationProvider::Leonardo, "leonardo");
      assert_serialization(GenerationProvider::Magnific, "magnific");
      assert_serialization(GenerationProvider::Openart, "openart");
      assert_serialization(GenerationProvider::Picsart, "picsart");
      assert_serialization(GenerationProvider::Pixverse, "pixverse");
      assert_serialization(GenerationProvider::Runway, "runway");
    }

    #[test]
    fn to_str() {
      assert_eq!(GenerationProvider::Artcraft.to_str(), "artcraft");
      assert_eq!(GenerationProvider::Fal.to_str(), "fal");
      assert_eq!(GenerationProvider::Grok.to_str(), "grok");
      assert_eq!(GenerationProvider::Midjourney.to_str(), "midjourney");
      assert_eq!(GenerationProvider::Sora.to_str(), "sora");
      assert_eq!(GenerationProvider::WorldLabs.to_str(), "world_labs");
      assert_eq!(GenerationProvider::Higgsfield.to_str(), "higgsfield");
      assert_eq!(GenerationProvider::Krea.to_str(), "krea");
      assert_eq!(GenerationProvider::Leonardo.to_str(), "leonardo");
      assert_eq!(GenerationProvider::Magnific.to_str(), "magnific");
      assert_eq!(GenerationProvider::Openart.to_str(), "openart");
      assert_eq!(GenerationProvider::Picsart.to_str(), "picsart");
      assert_eq!(GenerationProvider::Pixverse.to_str(), "pixverse");
      assert_eq!(GenerationProvider::Runway.to_str(), "runway");
    }

    #[test]
    fn from_str() {
      assert_eq!(GenerationProvider::from_str("artcraft").unwrap(), GenerationProvider::Artcraft);
      assert_eq!(GenerationProvider::from_str("fal").unwrap(), GenerationProvider::Fal);
      assert_eq!(GenerationProvider::from_str("grok").unwrap(), GenerationProvider::Grok);
      assert_eq!(GenerationProvider::from_str("midjourney").unwrap(), GenerationProvider::Midjourney);
      assert_eq!(GenerationProvider::from_str("sora").unwrap(), GenerationProvider::Sora);
      assert_eq!(GenerationProvider::from_str("world_labs").unwrap(), GenerationProvider::WorldLabs);
      assert_eq!(GenerationProvider::from_str("higgsfield").unwrap(), GenerationProvider::Higgsfield);
      assert_eq!(GenerationProvider::from_str("krea").unwrap(), GenerationProvider::Krea);
      assert_eq!(GenerationProvider::from_str("leonardo").unwrap(), GenerationProvider::Leonardo);
      assert_eq!(GenerationProvider::from_str("magnific").unwrap(), GenerationProvider::Magnific);
      assert_eq!(GenerationProvider::from_str("openart").unwrap(), GenerationProvider::Openart);
      assert_eq!(GenerationProvider::from_str("picsart").unwrap(), GenerationProvider::Picsart);
      assert_eq!(GenerationProvider::from_str("pixverse").unwrap(), GenerationProvider::Pixverse);
      assert_eq!(GenerationProvider::from_str("runway").unwrap(), GenerationProvider::Runway);
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
      assert_eq!(variants.len(), 14);
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Artcraft));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Fal));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Grok));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Midjourney));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Sora));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::WorldLabs));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Higgsfield));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Krea));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Leonardo));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Magnific));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Openart));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Picsart));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Pixverse));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Runway));
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
