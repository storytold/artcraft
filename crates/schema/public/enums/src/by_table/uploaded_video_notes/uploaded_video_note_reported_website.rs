use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `uploaded_video_notes` table in a `VARCHAR(32)` field.
///
/// The website / platform the note's submitter says the video came from.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum UploadedVideoNoteReportedWebsite {
  Runway,
  Higgsfield,
  Krea,
  OpenArt,
  Artcraft,
  Magnific,
  FreePik,
}

impl_enum_display_and_debug_using_to_str!(UploadedVideoNoteReportedWebsite);
impl_mysql_enum_coders!(UploadedVideoNoteReportedWebsite);
impl_mysql_from_row!(UploadedVideoNoteReportedWebsite);

impl UploadedVideoNoteReportedWebsite {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Runway => "runway",
      Self::Higgsfield => "higgsfield",
      Self::Krea => "krea",
      Self::OpenArt => "open_art",
      Self::Artcraft => "artcraft",
      Self::Magnific => "magnific",
      Self::FreePik => "free_pik",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "runway" => Ok(Self::Runway),
      "higgsfield" => Ok(Self::Higgsfield),
      "krea" => Ok(Self::Krea),
      "open_art" => Ok(Self::OpenArt),
      "artcraft" => Ok(Self::Artcraft),
      "magnific" => Ok(Self::Magnific),
      "free_pik" => Ok(Self::FreePik),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Runway,
      Self::Higgsfield,
      Self::Krea,
      Self::OpenArt,
      Self::Artcraft,
      Self::Magnific,
      Self::FreePik,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(UploadedVideoNoteReportedWebsite::Runway, "runway");
    assert_serialization(UploadedVideoNoteReportedWebsite::Higgsfield, "higgsfield");
    assert_serialization(UploadedVideoNoteReportedWebsite::Krea, "krea");
    assert_serialization(UploadedVideoNoteReportedWebsite::OpenArt, "open_art");
    assert_serialization(UploadedVideoNoteReportedWebsite::Artcraft, "artcraft");
    assert_serialization(UploadedVideoNoteReportedWebsite::Magnific, "magnific");
    assert_serialization(UploadedVideoNoteReportedWebsite::FreePik, "free_pik");
  }

  #[test]
  fn round_trip() {
    for variant in UploadedVideoNoteReportedWebsite::all_variants() {
      assert_eq!(variant, UploadedVideoNoteReportedWebsite::from_str(variant.to_str()).unwrap());
      assert_eq!(variant, UploadedVideoNoteReportedWebsite::from_str(&format!("{}", variant)).unwrap());
      assert_eq!(variant, UploadedVideoNoteReportedWebsite::from_str(&format!("{:?}", variant)).unwrap());
    }
    assert!(UploadedVideoNoteReportedWebsite::from_str("foo").is_err());
  }

  #[test]
  fn to_str_matches_serde() {
    for variant in UploadedVideoNoteReportedWebsite::all_variants() {
      let json = serde_json::to_string(&variant).unwrap();
      assert_eq!(json, format!("\"{}\"", variant.to_str()));
    }
  }

  #[test]
  fn variant_count() {
    use strum::IntoEnumIterator;
    assert_eq!(UploadedVideoNoteReportedWebsite::all_variants().len(), UploadedVideoNoteReportedWebsite::iter().len());
    assert_eq!(UploadedVideoNoteReportedWebsite::COUNT, 7);
  }

  #[test]
  fn serialized_length_ok_for_database() {
    const MAX_LENGTH: usize = 32;
    for variant in UploadedVideoNoteReportedWebsite::all_variants() {
      let serialized = variant.to_str();
      assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
      assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
    }
  }
}
