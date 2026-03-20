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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
