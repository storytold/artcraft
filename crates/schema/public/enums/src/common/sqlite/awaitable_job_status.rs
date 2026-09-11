use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the following SqLite tables and columns:
///   `web_scraping_targets` . `maybe_skip_reason`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub enum AwaitableJobStatus {
  #[serde(rename = "not_ready")]
  NotReady,

  #[serde(rename = "ready_waiting")]
  ReadyWaiting,

  #[serde(rename = "processing")]
  Processing,

  #[serde(rename = "retryably_failed")]
  RetryablyFailed,

  #[serde(rename = "permanently_failed")]
  PermanentlyFailed,

  #[serde(rename = "skipped")]
  Skipped,

  #[serde(rename = "done")]
  Done,
}

// TODO(bt, 2023-02-08): This desperately needs Sqlite integration tests!
impl_enum_display_and_debug_using_to_str!(AwaitableJobStatus);
impl_sqlite_enum_coders!(AwaitableJobStatus);

/// NB: Legacy API for older code.
impl AwaitableJobStatus {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::NotReady => "not_ready",
      Self::ReadyWaiting => "ready_waiting",
      Self::Processing => "processing",
      Self::RetryablyFailed => "retryably_failed",
      Self::PermanentlyFailed => "permanently_failed",
      Self::Skipped => "skipped",
      Self::Done => "done",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "not_ready" => Ok(Self::NotReady),
      "ready_waiting" => Ok(Self::ReadyWaiting),
      "processing" => Ok(Self::Processing),
      "retryably_failed" => Ok(Self::RetryablyFailed),
      "permanently_failed" => Ok(Self::PermanentlyFailed),
      "skipped" => Ok(Self::Skipped),
      "done" => Ok(Self::Done),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::common::sqlite::awaitable_job_status::AwaitableJobStatus;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(AwaitableJobStatus::NotReady, "not_ready");
      assert_serialization(AwaitableJobStatus::ReadyWaiting, "ready_waiting");
      assert_serialization(AwaitableJobStatus::Processing, "processing");
      assert_serialization(AwaitableJobStatus::RetryablyFailed, "retryably_failed");
      assert_serialization(AwaitableJobStatus::PermanentlyFailed, "permanently_failed");
      assert_serialization(AwaitableJobStatus::Skipped, "skipped");
      assert_serialization(AwaitableJobStatus::Done, "done");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(AwaitableJobStatus::NotReady.to_str(), "not_ready");
      assert_eq!(AwaitableJobStatus::ReadyWaiting.to_str(), "ready_waiting");
      assert_eq!(AwaitableJobStatus::Processing.to_str(), "processing");
      assert_eq!(AwaitableJobStatus::RetryablyFailed.to_str(), "retryably_failed");
      assert_eq!(AwaitableJobStatus::PermanentlyFailed.to_str(), "permanently_failed");
      assert_eq!(AwaitableJobStatus::Skipped.to_str(), "skipped");
      assert_eq!(AwaitableJobStatus::Done.to_str(), "done");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(AwaitableJobStatus::from_str("not_ready").unwrap(), AwaitableJobStatus::NotReady);
      assert_eq!(AwaitableJobStatus::from_str("ready_waiting").unwrap(), AwaitableJobStatus::ReadyWaiting);
      assert_eq!(AwaitableJobStatus::from_str("processing").unwrap(), AwaitableJobStatus::Processing);
      assert_eq!(AwaitableJobStatus::from_str("retryably_failed").unwrap(), AwaitableJobStatus::RetryablyFailed);
      assert_eq!(AwaitableJobStatus::from_str("permanently_failed").unwrap(), AwaitableJobStatus::PermanentlyFailed);
      assert_eq!(AwaitableJobStatus::from_str("skipped").unwrap(), AwaitableJobStatus::Skipped);
      assert_eq!(AwaitableJobStatus::from_str("done").unwrap(), AwaitableJobStatus::Done);
      assert!(AwaitableJobStatus::from_str("foo").is_err());
    }
  }
}
