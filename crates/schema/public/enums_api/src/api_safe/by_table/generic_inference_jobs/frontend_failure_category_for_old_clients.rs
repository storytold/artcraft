use strum::EnumIter;
use utoipa::ToSchema;

/// A restricted subset of `FrontendFailureCategory` that only includes values
/// known to old deployed clients. New failure categories are omitted so that
/// old clients never receive an enum value they cannot deserialize.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter)]
pub enum FrontendFailureCategoryForOldClients {
  #[serde(rename = "face_not_detected")]
  FaceNotDetected,

  #[serde(rename = "keep_alive_elapsed")]
  KeepAliveElapsed,

  #[serde(rename = "not_yet_implemented")]
  NotYetImplemented,

  #[serde(rename = "retryable_worker_error")]
  RetryableWorkerError,
}

#[cfg(test)]
mod tests {
  use super::FrontendFailureCategoryForOldClients;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(FrontendFailureCategoryForOldClients::FaceNotDetected, "face_not_detected");
      assert_serialization(FrontendFailureCategoryForOldClients::KeepAliveElapsed, "keep_alive_elapsed");
      assert_serialization(FrontendFailureCategoryForOldClients::NotYetImplemented, "not_yet_implemented");
      assert_serialization(FrontendFailureCategoryForOldClients::RetryableWorkerError, "retryable_worker_error");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("face_not_detected", FrontendFailureCategoryForOldClients::FaceNotDetected);
      assert_deserialization("keep_alive_elapsed", FrontendFailureCategoryForOldClients::KeepAliveElapsed);
      assert_deserialization("not_yet_implemented", FrontendFailureCategoryForOldClients::NotYetImplemented);
      assert_deserialization("retryable_worker_error", FrontendFailureCategoryForOldClients::RetryableWorkerError);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(FrontendFailureCategoryForOldClients::iter().count(), 4);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in FrontendFailureCategoryForOldClients::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: FrontendFailureCategoryForOldClients = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
