use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `uploaded_videos` table in a `VARCHAR(32)` field.
///
/// The detected provenance family of an uploaded video.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum UploadedVideoDetectedModelFamily {
  Seedance,
  Veo,
  Sora,
  Kling,
  Grok,
  HappyHorse,
}

impl_enum_display_and_debug_using_to_str!(UploadedVideoDetectedModelFamily);
impl_mysql_enum_coders!(UploadedVideoDetectedModelFamily);
impl_mysql_from_row!(UploadedVideoDetectedModelFamily);

impl UploadedVideoDetectedModelFamily {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Seedance => "seedance",
      Self::Veo => "veo",
      Self::Sora => "sora",
      Self::Kling => "kling",
      Self::Grok => "grok",
      Self::HappyHorse => "happy_horse",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "seedance" => Ok(Self::Seedance),
      "veo" => Ok(Self::Veo),
      "sora" => Ok(Self::Sora),
      "kling" => Ok(Self::Kling),
      "grok" => Ok(Self::Grok),
      "happy_horse" => Ok(Self::HappyHorse),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Seedance,
      Self::Veo,
      Self::Sora,
      Self::Kling,
      Self::Grok,
      Self::HappyHorse,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(UploadedVideoDetectedModelFamily::Seedance, "seedance");
    assert_serialization(UploadedVideoDetectedModelFamily::Veo, "veo");
    assert_serialization(UploadedVideoDetectedModelFamily::Sora, "sora");
    assert_serialization(UploadedVideoDetectedModelFamily::Kling, "kling");
    assert_serialization(UploadedVideoDetectedModelFamily::Grok, "grok");
    assert_serialization(UploadedVideoDetectedModelFamily::HappyHorse, "happy_horse");
  }

  #[test]
  fn round_trip() {
    for variant in UploadedVideoDetectedModelFamily::all_variants() {
      assert_eq!(variant, UploadedVideoDetectedModelFamily::from_str(variant.to_str()).unwrap());
      assert_eq!(variant, UploadedVideoDetectedModelFamily::from_str(&format!("{}", variant)).unwrap());
      assert_eq!(variant, UploadedVideoDetectedModelFamily::from_str(&format!("{:?}", variant)).unwrap());
    }
    assert!(UploadedVideoDetectedModelFamily::from_str("foo").is_err());
  }

  #[test]
  fn to_str_matches_serde() {
    for variant in UploadedVideoDetectedModelFamily::all_variants() {
      let json = serde_json::to_string(&variant).unwrap();
      assert_eq!(json, format!("\"{}\"", variant.to_str()));
    }
  }

  #[test]
  fn variant_count() {
    use strum::IntoEnumIterator;
    assert_eq!(UploadedVideoDetectedModelFamily::all_variants().len(), UploadedVideoDetectedModelFamily::iter().len());
    assert_eq!(UploadedVideoDetectedModelFamily::COUNT, 6);
  }

  #[test]
  fn serialized_length_ok_for_database() {
    const MAX_LENGTH: usize = 32;
    for variant in UploadedVideoDetectedModelFamily::all_variants() {
      let serialized = variant.to_str();
      assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
      assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
    }
  }
}
