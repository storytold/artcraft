use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `model_category`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum ZsVoiceModelCategory {
  /// TTS-type zero shot models
  #[serde(rename = "tts")]
  Tts,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ZsVoiceModelCategory);
impl_mysql_enum_coders!(ZsVoiceModelCategory);

/// NB: Legacy API for older code.
impl ZsVoiceModelCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Tts => "tts",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "tts" => Ok(Self::Tts),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Tts,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::zs_voices::model_category::ZsVoiceModelCategory;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceModelCategory::Tts, "tts");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(ZsVoiceModelCategory::Tts.to_str(), "tts");
    }

    #[test]
    fn from_str() {
      assert_eq!(ZsVoiceModelCategory::from_str("tts").unwrap(), ZsVoiceModelCategory::Tts);
      assert!(ZsVoiceModelCategory::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = ZsVoiceModelCategory::all_variants();
      assert_eq!(variants.len(), 1);
      assert_eq!(variants.pop_first(), Some(ZsVoiceModelCategory::Tts));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(ZsVoiceModelCategory::all_variants().len(), ZsVoiceModelCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in ZsVoiceModelCategory::all_variants() {
        assert_eq!(variant, ZsVoiceModelCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ZsVoiceModelCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ZsVoiceModelCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
