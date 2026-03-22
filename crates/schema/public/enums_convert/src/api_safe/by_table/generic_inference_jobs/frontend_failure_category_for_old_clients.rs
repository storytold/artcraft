use enums_api::api_safe::by_table::generic_inference_jobs::frontend_failure_category_for_old_clients::FrontendFailureCategoryForOldClients;
use enums_db::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;

/// Convert a DB `FrontendFailureCategory` to the restricted old-client type.
/// Returns `None` for categories that old clients do not understand.
pub fn try_frontend_failure_category_to_old_clients(db_value: &FrontendFailureCategory) -> Option<FrontendFailureCategoryForOldClients> {
  match db_value {
    FrontendFailureCategory::FaceNotDetected => Some(FrontendFailureCategoryForOldClients::FaceNotDetected),
    FrontendFailureCategory::KeepAliveElapsed => Some(FrontendFailureCategoryForOldClients::KeepAliveElapsed),
    FrontendFailureCategory::NotYetImplemented => Some(FrontendFailureCategoryForOldClients::NotYetImplemented),
    FrontendFailureCategory::RetryableWorkerError => Some(FrontendFailureCategoryForOldClients::RetryableWorkerError),
    _ => None,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variants_convert() {
    assert_eq!(
      try_frontend_failure_category_to_old_clients(&FrontendFailureCategory::FaceNotDetected),
      Some(FrontendFailureCategoryForOldClients::FaceNotDetected)
    );
    assert_eq!(
      try_frontend_failure_category_to_old_clients(&FrontendFailureCategory::KeepAliveElapsed),
      Some(FrontendFailureCategoryForOldClients::KeepAliveElapsed)
    );
  }

  #[test]
  fn new_variants_return_none() {
    assert_eq!(try_frontend_failure_category_to_old_clients(&FrontendFailureCategory::ModelRulesViolation), None);
    assert_eq!(try_frontend_failure_category_to_old_clients(&FrontendFailureCategory::GenerationFailed), None);
  }
}
