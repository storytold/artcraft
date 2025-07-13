use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerationProvider {
  Artcraft,
  Fal,
  Sora,
}

impl_enum_display_and_debug_using_to_str!(GenerationProvider);
impl_mysql_enum_coders!(GenerationProvider);
impl_mysql_from_row!(GenerationProvider);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl GenerationProvider {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::Fal => "fal",
      Self::Sora => "sora",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      "artcraft" => Ok(Self::Artcraft),
      "fal" => Ok(Self::Fal),
      "sora" => Ok(Self::Sora),
      _ => Err(format!("invalid task_state: {:?}", job_status)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Artcraft,
      Self::Fal,
      Self::Sora,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::test_helpers::assert_serialization;
  use crate::common::generation_provider::GenerationProvider;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(GenerationProvider::Artcraft, "artcraft");
      assert_serialization(GenerationProvider::Fal, "fal");
      assert_serialization(GenerationProvider::Sora, "sora");
    }

    #[test]
    fn to_str() {
      assert_eq!(GenerationProvider::Artcraft.to_str(), "artcraft");
      assert_eq!(GenerationProvider::Fal.to_str(), "fal");
      assert_eq!(GenerationProvider::Sora.to_str(), "sora");
    }

    #[test]
    fn from_str() {
      assert_eq!(GenerationProvider::from_str("artcraft").unwrap(), GenerationProvider::Artcraft);
      assert_eq!(GenerationProvider::from_str("fal").unwrap(), GenerationProvider::Fal);
      assert_eq!(GenerationProvider::from_str("sora").unwrap(), GenerationProvider::Sora);
    }

    #[test]
    fn all_variants() {
      let mut variants = GenerationProvider::all_variants();
      assert_eq!(variants.len(), 3);
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Artcraft));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Fal));
      assert_eq!(variants.pop_first(), Some(GenerationProvider::Sora));
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
  }
}
