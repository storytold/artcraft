use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `scraping_status`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
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

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ScrapingStatus);
impl_sqlite_enum_coders!(ScrapingStatus);

/// NB: Legacy API for older code.
impl ScrapingStatus {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::New => "new",
      Self::Skipped => "skipped",
      Self::Failed => "failed",
      Self::PermanentlyFailed => "permanently_failed",
      Self::Success => "success",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "new" => Ok(Self::New),
      "skipped" => Ok(Self::Skipped),
      "failed" => Ok(Self::Failed),
      "permanently_failed" => Ok(Self::PermanentlyFailed),
      "success" => Ok(Self::Success),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::web_scraping_targets::scraping_status::ScrapingStatus;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ScrapingStatus::New, "new");
      assert_serialization(ScrapingStatus::Skipped, "skipped");
      assert_serialization(ScrapingStatus::Failed, "failed");
      assert_serialization(ScrapingStatus::PermanentlyFailed, "permanently_failed");
      assert_serialization(ScrapingStatus::Success, "success");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(ScrapingStatus::New.to_str(), "new");
      assert_eq!(ScrapingStatus::Skipped.to_str(), "skipped");
      assert_eq!(ScrapingStatus::Failed.to_str(), "failed");
      assert_eq!(ScrapingStatus::PermanentlyFailed.to_str(), "permanently_failed");
      assert_eq!(ScrapingStatus::Success.to_str(), "success");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(ScrapingStatus::from_str("new").unwrap(), ScrapingStatus::New);
      assert_eq!(ScrapingStatus::from_str("skipped").unwrap(), ScrapingStatus::Skipped);
      assert_eq!(ScrapingStatus::from_str("failed").unwrap(), ScrapingStatus::Failed);
      assert_eq!(ScrapingStatus::from_str("permanently_failed").unwrap(), ScrapingStatus::PermanentlyFailed);
      assert_eq!(ScrapingStatus::from_str("success").unwrap(), ScrapingStatus::Success);
      assert!(ScrapingStatus::from_str("foo").is_err());
    }
  }
}
