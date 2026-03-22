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
}

#[cfg(test)]
mod tests {
  use super::JobStatusPlus;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(JobStatusPlus::Pending, "pending");
      assert_serialization(JobStatusPlus::Started, "started");
      assert_serialization(JobStatusPlus::CompleteSuccess, "complete_success");
      assert_serialization(JobStatusPlus::CompleteFailure, "complete_failure");
      assert_serialization(JobStatusPlus::AttemptFailed, "attempt_failed");
      assert_serialization(JobStatusPlus::Dead, "dead");
      assert_serialization(JobStatusPlus::CancelledByUser, "cancelled_by_user");
      assert_serialization(JobStatusPlus::CancelledBySystem, "cancelled_by_system");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("pending", JobStatusPlus::Pending);
      assert_deserialization("started", JobStatusPlus::Started);
      assert_deserialization("complete_success", JobStatusPlus::CompleteSuccess);
      assert_deserialization("complete_failure", JobStatusPlus::CompleteFailure);
      assert_deserialization("attempt_failed", JobStatusPlus::AttemptFailed);
      assert_deserialization("dead", JobStatusPlus::Dead);
      assert_deserialization("cancelled_by_user", JobStatusPlus::CancelledByUser);
      assert_deserialization("cancelled_by_system", JobStatusPlus::CancelledBySystem);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(JobStatusPlus::iter().count(), 8);
    }
  }

  mod to_str_checks {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(JobStatusPlus::Pending.to_str(), "pending");
      assert_eq!(JobStatusPlus::Started.to_str(), "started");
      assert_eq!(JobStatusPlus::CompleteSuccess.to_str(), "complete_success");
      assert_eq!(JobStatusPlus::CompleteFailure.to_str(), "complete_failure");
      assert_eq!(JobStatusPlus::AttemptFailed.to_str(), "attempt_failed");
      assert_eq!(JobStatusPlus::Dead.to_str(), "dead");
      assert_eq!(JobStatusPlus::CancelledByUser.to_str(), "cancelled_by_user");
      assert_eq!(JobStatusPlus::CancelledBySystem.to_str(), "cancelled_by_system");
    }

    #[test]
    fn to_str_matches_serde() {
      for variant in JobStatusPlus::iter() {
        let serde_str = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert_eq!(variant.to_str(), serde_str);
      }
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in JobStatusPlus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: JobStatusPlus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
