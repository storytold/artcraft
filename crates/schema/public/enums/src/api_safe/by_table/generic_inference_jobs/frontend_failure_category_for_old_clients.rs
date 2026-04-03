use crate::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
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

impl FrontendFailureCategoryForOldClients {
  /// Attempts to convert a database-level `FrontendFailureCategory` into the
  /// restricted old-client enum. Returns `None` for categories that old
  /// clients do not understand.
  pub fn try_from_db_enum(value: FrontendFailureCategory) -> Option<Self> {
    match value {
      FrontendFailureCategory::FaceNotDetected => Some(Self::FaceNotDetected),
      FrontendFailureCategory::KeepAliveElapsed => Some(Self::KeepAliveElapsed),
      FrontendFailureCategory::NotYetImplemented => Some(Self::NotYetImplemented),
      FrontendFailureCategory::RetryableWorkerError => Some(Self::RetryableWorkerError),
      _ => None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_known_variants_convert() {
    assert_eq!(
      FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::FaceNotDetected),
      Some(FrontendFailureCategoryForOldClients::FaceNotDetected)
    );
    assert_eq!(
      FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::KeepAliveElapsed),
      Some(FrontendFailureCategoryForOldClients::KeepAliveElapsed)
    );
    assert_eq!(
      FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::NotYetImplemented),
      Some(FrontendFailureCategoryForOldClients::NotYetImplemented)
    );
    assert_eq!(
      FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::RetryableWorkerError),
      Some(FrontendFailureCategoryForOldClients::RetryableWorkerError)
    );
  }

  #[test]
  fn test_new_variants_return_none() {
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::ModelRulesViolation), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::RuleBansUserImage), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::RuleBansUserImageWithFaces), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::RuleBansUserTextPrompt), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::RuleBansUserContent), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::RuleBansGeneratedVideo), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::RuleBansGeneratedAudio), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::RuleBansGeneratedContent), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::GenerationFailed), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::FilesizeTooLarge), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::ImageDimensionsTooSmall), None);
    assert_eq!(FrontendFailureCategoryForOldClients::try_from_db_enum(FrontendFailureCategory::ImageDimensionsTooLarge), None);
  }

  #[test]
  fn test_serialization() {
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForOldClients::FaceNotDetected).unwrap(), "\"face_not_detected\"");
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForOldClients::KeepAliveElapsed).unwrap(), "\"keep_alive_elapsed\"");
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForOldClients::NotYetImplemented).unwrap(), "\"not_yet_implemented\"");
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForOldClients::RetryableWorkerError).unwrap(), "\"retryable_worker_error\"");
  }
}
