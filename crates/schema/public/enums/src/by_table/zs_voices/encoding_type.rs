use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `encoding_type`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum ZsVoiceEncodingType {
  /// Encodec features
  #[serde(rename = "encodec")]
  Encodec,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ZsVoiceEncodingType);
impl_mysql_enum_coders!(ZsVoiceEncodingType);

/// NB: Legacy API for older code.
impl ZsVoiceEncodingType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Encodec => "encodec",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "encodec" => Ok(Self::Encodec),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Encodec,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::zs_voices::encoding_type::ZsVoiceEncodingType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceEncodingType::Encodec, "encodec");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(ZsVoiceEncodingType::Encodec.to_str(), "encodec");
    }

    #[test]
    fn from_str() {
      assert_eq!(ZsVoiceEncodingType::from_str("encodec").unwrap(), ZsVoiceEncodingType::Encodec);
      assert!(ZsVoiceEncodingType::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = ZsVoiceEncodingType::all_variants();
      assert_eq!(variants.len(), 1);
      assert_eq!(variants.pop_first(), Some(ZsVoiceEncodingType::Encodec));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(ZsVoiceEncodingType::all_variants().len(), ZsVoiceEncodingType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in ZsVoiceEncodingType::all_variants() {
        assert_eq!(variant, ZsVoiceEncodingType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ZsVoiceEncodingType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ZsVoiceEncodingType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
