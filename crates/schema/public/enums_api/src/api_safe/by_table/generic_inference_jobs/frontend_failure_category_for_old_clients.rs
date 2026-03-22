use utoipa::ToSchema;

/// A restricted subset of `FrontendFailureCategory` that only includes values
/// known to old deployed clients. New failure categories are omitted so that
/// old clients never receive an enum value they cannot deserialize.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema)]
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
  use super::*;

  #[test]
  fn test_serialization() {
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForOldClients::FaceNotDetected).unwrap(), "\"face_not_detected\"");
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForOldClients::KeepAliveElapsed).unwrap(), "\"keep_alive_elapsed\"");
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForOldClients::NotYetImplemented).unwrap(), "\"not_yet_implemented\"");
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForOldClients::RetryableWorkerError).unwrap(), "\"retryable_worker_error\"");
  }
}
