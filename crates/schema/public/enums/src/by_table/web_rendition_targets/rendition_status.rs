use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `scraping_status`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
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

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(RenditionStatus);
impl_sqlite_enum_coders!(RenditionStatus);

/// NB: Legacy API for older code.
impl RenditionStatus {
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
  use crate::by_table::web_rendition_targets::rendition_status::RenditionStatus;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(RenditionStatus::New, "new");
      assert_serialization(RenditionStatus::Skipped, "skipped");
      assert_serialization(RenditionStatus::Failed, "failed");
      assert_serialization(RenditionStatus::PermanentlyFailed, "permanently_failed");
      assert_serialization(RenditionStatus::Success, "success");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(RenditionStatus::New.to_str(), "new");
      assert_eq!(RenditionStatus::Skipped.to_str(), "skipped");
      assert_eq!(RenditionStatus::Failed.to_str(), "failed");
      assert_eq!(RenditionStatus::PermanentlyFailed.to_str(), "permanently_failed");
      assert_eq!(RenditionStatus::Success.to_str(), "success");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(RenditionStatus::from_str("new").unwrap(), RenditionStatus::New);
      assert_eq!(RenditionStatus::from_str("skipped").unwrap(), RenditionStatus::Skipped);
      assert_eq!(RenditionStatus::from_str("failed").unwrap(), RenditionStatus::Failed);
      assert_eq!(RenditionStatus::from_str("permanently_failed").unwrap(), RenditionStatus::PermanentlyFailed);
      assert_eq!(RenditionStatus::from_str("success").unwrap(), RenditionStatus::Success);
      assert!(RenditionStatus::from_str("foo").is_err());
    }
  }
}
