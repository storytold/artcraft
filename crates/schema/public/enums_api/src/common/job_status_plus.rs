use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// This is used in newer jobs (that add additional enum states)
///
///  - generic_inference_job
///  - (no other jobs yet)
///
/// See the documentation on the table for usage.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum JobStatusPlus {
  Pending,
  Started,
  CompleteSuccess,
  CompleteFailure,
  AttemptFailed,
  Dead,
  CancelledByUser,
  CancelledBySystem,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!


impl Default for JobStatusPlus {
  fn default() -> Self {
    Self::Pending
  }
}

impl JobStatusPlus {
  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::Pending => "pending",
      Self::Started => "started",
      Self::CompleteSuccess => "complete_success",
      Self::CompleteFailure => "complete_failure",
      Self::AttemptFailed => "attempt_failed",
      Self::Dead => "dead",
      Self::CancelledByUser => "cancelled_by_user",
      Self::CancelledBySystem => "cancelled_by_system",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      "pending" => Ok(Self::Pending),
      "started" => Ok(Self::Started),
      "complete_success" => Ok(Self::CompleteSuccess),
      "complete_failure" => Ok(Self::CompleteFailure),
      "attempt_failed" => Ok(Self::AttemptFailed),
      "dead" => Ok(Self::Dead),
      "cancelled_by_user" => Ok(Self::CancelledByUser),
      "cancelled_by_system" => Ok(Self::CancelledBySystem),
      _ => Err(format!("invalid job_status: {:?}", job_status)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Pending,
      Self::Started,
      Self::CompleteSuccess,
      Self::CompleteFailure,
      Self::AttemptFailed,
      Self::Dead,
      Self::CancelledByUser,
      Self::CancelledBySystem,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::JobStatusPlus;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in JobStatusPlus::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: JobStatusPlus = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
