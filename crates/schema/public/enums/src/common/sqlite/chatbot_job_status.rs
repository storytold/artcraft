use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `scraping_status`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
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

// TODO(bt, 2023-02-10): This desperately needs Sqlite integration tests!
impl_enum_display_and_debug_using_to_str!(ChatbotJobStatus);
impl_sqlite_enum_coders!(ChatbotJobStatus);

/// NB: Legacy API for older code.
impl ChatbotJobStatus {
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
  use crate::common::sqlite::chatbot_job_status::ChatbotJobStatus;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ChatbotJobStatus::New, "new");
      assert_serialization(ChatbotJobStatus::Skipped, "skipped");
      assert_serialization(ChatbotJobStatus::Failed, "failed");
      assert_serialization(ChatbotJobStatus::PermanentlyFailed, "permanently_failed");
      assert_serialization(ChatbotJobStatus::Success, "success");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(ChatbotJobStatus::New.to_str(), "new");
      assert_eq!(ChatbotJobStatus::Skipped.to_str(), "skipped");
      assert_eq!(ChatbotJobStatus::Failed.to_str(), "failed");
      assert_eq!(ChatbotJobStatus::PermanentlyFailed.to_str(), "permanently_failed");
      assert_eq!(ChatbotJobStatus::Success.to_str(), "success");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(ChatbotJobStatus::from_str("new").unwrap(), ChatbotJobStatus::New);
      assert_eq!(ChatbotJobStatus::from_str("skipped").unwrap(), ChatbotJobStatus::Skipped);
      assert_eq!(ChatbotJobStatus::from_str("failed").unwrap(), ChatbotJobStatus::Failed);
      assert_eq!(ChatbotJobStatus::from_str("permanently_failed").unwrap(), ChatbotJobStatus::PermanentlyFailed);
      assert_eq!(ChatbotJobStatus::from_str("success").unwrap(), ChatbotJobStatus::Success);
      assert!(ChatbotJobStatus::from_str("foo").is_err());
    }
  }
}
