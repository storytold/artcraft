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
