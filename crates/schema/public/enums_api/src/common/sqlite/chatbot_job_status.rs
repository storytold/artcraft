use serde::Deserialize;
use serde::Serialize;
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `scraping_status`.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, EnumIter, ToSchema)]

pub enum ChatbotJobStatus {
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
  use super::ChatbotJobStatus;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ChatbotJobStatus::New, "new");
      assert_serialization(ChatbotJobStatus::Skipped, "skipped");
      assert_serialization(ChatbotJobStatus::Failed, "failed");
      assert_serialization(ChatbotJobStatus::PermanentlyFailed, "permanently_failed");
      assert_serialization(ChatbotJobStatus::Success, "success");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("new", ChatbotJobStatus::New);
      assert_deserialization("skipped", ChatbotJobStatus::Skipped);
      assert_deserialization("failed", ChatbotJobStatus::Failed);
      assert_deserialization("permanently_failed", ChatbotJobStatus::PermanentlyFailed);
      assert_deserialization("success", ChatbotJobStatus::Success);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ChatbotJobStatus::iter().count(), 5);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ChatbotJobStatus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ChatbotJobStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
