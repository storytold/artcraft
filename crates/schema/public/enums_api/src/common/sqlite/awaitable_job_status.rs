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

// TODO(bt, 2023-02-08): This desperately needs Sqlite integration tests!

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
  use super::AwaitableJobStatus;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in AwaitableJobStatus::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: AwaitableJobStatus = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
