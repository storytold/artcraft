use strum::EnumCount;
use strum::EnumIter;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `scraping_status`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, EnumIter, EnumCount)]
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
  use super::super::scraping_status::ScrapingStatus;
  use enums_shared::test_helpers::assert_serialization;

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

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in ScrapingStatus::iter() {
        assert_eq!(variant, ScrapingStatus::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ScrapingStatus::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ScrapingStatus::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in ScrapingStatus::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
