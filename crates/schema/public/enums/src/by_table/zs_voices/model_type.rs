use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `model_type`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum ZsVoiceModelType {
  /// TTS-type zero shot models
  #[serde(rename = "vall-e-x")]
  VallEX,
  #[serde(rename = "styletts2")]
  StyleTTS2,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ZsVoiceModelType);
impl_mysql_enum_coders!(ZsVoiceModelType);

/// NB: Legacy API for older code.
impl ZsVoiceModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::VallEX=> "vall-e-x",
      Self::StyleTTS2 => "styletts2",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "vall-e-x" => Ok(Self::VallEX),
      "styletts2" => Ok(Self::StyleTTS2),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::VallEX,
      Self::StyleTTS2,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::zs_voices::model_type::ZsVoiceModelType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceModelType::VallEX, "vall-e-x");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(ZsVoiceModelType::VallEX.to_str(), "vall-e-x");
      assert_eq!(ZsVoiceModelType::StyleTTS2.to_str(), "styletts2");
    }

    #[test]
    fn from_str() {
      assert_eq!(ZsVoiceModelType::from_str("vall-e-x").unwrap(), ZsVoiceModelType::VallEX);
      assert_eq!(ZsVoiceModelType::from_str("styletts2").unwrap(), ZsVoiceModelType::StyleTTS2);
      assert!(ZsVoiceModelType::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = ZsVoiceModelType::all_variants();
      assert_eq!(variants.len(), 2);
      assert_eq!(variants.pop_first(), Some(ZsVoiceModelType::VallEX));
      assert_eq!(variants.pop_first(), Some(ZsVoiceModelType::StyleTTS2));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(ZsVoiceModelType::all_variants().len(), ZsVoiceModelType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in ZsVoiceModelType::all_variants() {
        assert_eq!(variant, ZsVoiceModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ZsVoiceModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ZsVoiceModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
