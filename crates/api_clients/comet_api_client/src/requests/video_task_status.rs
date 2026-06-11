use std::fmt;

use serde::de::{Deserialize, Deserializer};
use serde::ser::{Serialize, Serializer};

/// Lifecycle status of a CometAPI video task.
///
/// The `Unknown(String)` catch-all future-proofs against CometAPI adding new
/// states — callers should treat unknown states as still-running unless
/// proven otherwise.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CometVideoTaskStatus {
  Queued,
  InProgress,
  Completed,
  Failed,
  Error,
  Unknown(String),
}

impl CometVideoTaskStatus {
  pub fn to_str(&self) -> &str {
    match self {
      Self::Queued => "queued",
      Self::InProgress => "in_progress",
      Self::Completed => "completed",
      Self::Failed => "failed",
      Self::Error => "error",
      Self::Unknown(value) => value,
    }
  }

  pub fn from_str(value: &str) -> Self {
    match value {
      "queued" => Self::Queued,
      "in_progress" => Self::InProgress,
      "completed" => Self::Completed,
      "failed" => Self::Failed,
      "error" => Self::Error,
      other => Self::Unknown(other.to_string()),
    }
  }

  /// Whether the task has reached a terminal state (stop polling).
  pub fn is_terminal(&self) -> bool {
    matches!(self, Self::Completed | Self::Failed | Self::Error)
  }

  pub fn is_success(&self) -> bool {
    matches!(self, Self::Completed)
  }

  pub fn is_failure(&self) -> bool {
    matches!(self, Self::Failed | Self::Error)
  }
}

impl fmt::Display for CometVideoTaskStatus {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.to_str())
  }
}

impl<'de> Deserialize<'de> for CometVideoTaskStatus {
  fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
    let value = String::deserialize(deserializer)?;
    Ok(Self::from_str(&value))
  }
}

impl Serialize for CometVideoTaskStatus {
  fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
    serializer.serialize_str(self.to_str())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn deserialize_known_states() {
    let cases = [
      ("\"queued\"", CometVideoTaskStatus::Queued),
      ("\"in_progress\"", CometVideoTaskStatus::InProgress),
      ("\"completed\"", CometVideoTaskStatus::Completed),
      ("\"failed\"", CometVideoTaskStatus::Failed),
      ("\"error\"", CometVideoTaskStatus::Error),
    ];
    for (json, expected) in cases {
      let status: CometVideoTaskStatus = serde_json::from_str(json).expect("should parse");
      assert_eq!(status, expected);
    }
  }

  #[test]
  fn deserialize_unknown_state_is_future_proof() {
    let status: CometVideoTaskStatus = serde_json::from_str("\"hyper_queued\"").expect("should parse");
    assert_eq!(status, CometVideoTaskStatus::Unknown("hyper_queued".to_string()));
    assert!(!status.is_terminal());
  }

  #[test]
  fn round_trip() {
    for status in [
      CometVideoTaskStatus::Queued,
      CometVideoTaskStatus::InProgress,
      CometVideoTaskStatus::Completed,
      CometVideoTaskStatus::Failed,
      CometVideoTaskStatus::Error,
      CometVideoTaskStatus::Unknown("new_state".to_string()),
    ] {
      let json = serde_json::to_string(&status).expect("should serialize");
      let parsed: CometVideoTaskStatus = serde_json::from_str(&json).expect("should parse");
      assert_eq!(parsed, status);
    }
  }

  #[test]
  fn terminal_states() {
    assert!(!CometVideoTaskStatus::Queued.is_terminal());
    assert!(!CometVideoTaskStatus::InProgress.is_terminal());
    assert!(CometVideoTaskStatus::Completed.is_terminal());
    assert!(CometVideoTaskStatus::Failed.is_terminal());
    assert!(CometVideoTaskStatus::Error.is_terminal());

    assert!(CometVideoTaskStatus::Completed.is_success());
    assert!(!CometVideoTaskStatus::Completed.is_failure());
    assert!(CometVideoTaskStatus::Failed.is_failure());
    assert!(CometVideoTaskStatus::Error.is_failure());
  }
}
