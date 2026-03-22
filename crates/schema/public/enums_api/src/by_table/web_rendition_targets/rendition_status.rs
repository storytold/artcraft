use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `scraping_status`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum RenditionStatus {
  #[serde(rename = "new")]
  New,

  #[serde(rename = "skipped")]
  Skipped,

  #[serde(rename = "failed")]
  Failed,

  #[serde(rename = "permanently_failed")]
  PermanentlyFailed,

  #[serde(rename = "success")]
  Success,
}

#[cfg(test)]
mod tests {
  use super::RenditionStatus;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(RenditionStatus::New, "new");
      assert_serialization(RenditionStatus::Skipped, "skipped");
      assert_serialization(RenditionStatus::Failed, "failed");
      assert_serialization(RenditionStatus::PermanentlyFailed, "permanently_failed");
      assert_serialization(RenditionStatus::Success, "success");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("new", RenditionStatus::New);
      assert_deserialization("skipped", RenditionStatus::Skipped);
      assert_deserialization("failed", RenditionStatus::Failed);
      assert_deserialization("permanently_failed", RenditionStatus::PermanentlyFailed);
      assert_deserialization("success", RenditionStatus::Success);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(RenditionStatus::iter().count(), 5);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in RenditionStatus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: RenditionStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
