use serde::Deserialize;
use serde::Serialize;
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the following SqLite tables and columns:
///   `web_scraping_targets` . `maybe_skip_reason`.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, EnumIter, ToSchema)]

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

#[cfg(test)]
mod tests {
  use super::AwaitableJobStatus;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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

    #[test]
    fn test_deserialization() {
      assert_deserialization("not_ready", AwaitableJobStatus::NotReady);
      assert_deserialization("ready_waiting", AwaitableJobStatus::ReadyWaiting);
      assert_deserialization("processing", AwaitableJobStatus::Processing);
      assert_deserialization("retryably_failed", AwaitableJobStatus::RetryablyFailed);
      assert_deserialization("permanently_failed", AwaitableJobStatus::PermanentlyFailed);
      assert_deserialization("skipped", AwaitableJobStatus::Skipped);
      assert_deserialization("done", AwaitableJobStatus::Done);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(AwaitableJobStatus::iter().count(), 7);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in AwaitableJobStatus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: AwaitableJobStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
