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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
