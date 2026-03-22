
use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum TaskStatus {
  Pending,
  Started,
  CompleteSuccess,
  CompleteFailure,
  AttemptFailed,
  Dead,
  CancelledByUser,
  CancelledByProvider,
  CancelledByUs,
}

#[cfg(test)]
mod tests {
  use super::TaskStatus;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(TaskStatus::Pending, "pending");
      assert_serialization(TaskStatus::Started, "started");
      assert_serialization(TaskStatus::CompleteSuccess, "complete_success");
      assert_serialization(TaskStatus::CompleteFailure, "complete_failure");
      assert_serialization(TaskStatus::AttemptFailed, "attempt_failed");
      assert_serialization(TaskStatus::Dead, "dead");
      assert_serialization(TaskStatus::CancelledByUser, "cancelled_by_user");
      assert_serialization(TaskStatus::CancelledByProvider, "cancelled_by_provider");
      assert_serialization(TaskStatus::CancelledByUs, "cancelled_by_us");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("pending", TaskStatus::Pending);
      assert_deserialization("started", TaskStatus::Started);
      assert_deserialization("complete_success", TaskStatus::CompleteSuccess);
      assert_deserialization("complete_failure", TaskStatus::CompleteFailure);
      assert_deserialization("attempt_failed", TaskStatus::AttemptFailed);
      assert_deserialization("dead", TaskStatus::Dead);
      assert_deserialization("cancelled_by_user", TaskStatus::CancelledByUser);
      assert_deserialization("cancelled_by_provider", TaskStatus::CancelledByProvider);
      assert_deserialization("cancelled_by_us", TaskStatus::CancelledByUs);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(TaskStatus::iter().count(), 9);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TaskStatus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TaskStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
