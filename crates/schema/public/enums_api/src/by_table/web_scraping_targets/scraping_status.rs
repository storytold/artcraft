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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
