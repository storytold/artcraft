use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `scraping_status`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum ScrapingStatus {
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
  use super::ScrapingStatus;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ScrapingStatus::New, "new");
      assert_serialization(ScrapingStatus::Skipped, "skipped");
      assert_serialization(ScrapingStatus::Failed, "failed");
      assert_serialization(ScrapingStatus::PermanentlyFailed, "permanently_failed");
      assert_serialization(ScrapingStatus::Success, "success");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("new", ScrapingStatus::New);
      assert_deserialization("skipped", ScrapingStatus::Skipped);
      assert_deserialization("failed", ScrapingStatus::Failed);
      assert_deserialization("permanently_failed", ScrapingStatus::PermanentlyFailed);
      assert_deserialization("success", ScrapingStatus::Success);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ScrapingStatus::iter().count(), 5);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ScrapingStatus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ScrapingStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
