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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
