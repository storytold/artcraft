use enums_api::api_safe::by_table::generic_inference_jobs::frontend_failure_category_for_api_clients::FrontendFailureCategoryForApiClients;
use enums_db::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;

/// Convert a DB `FrontendFailureCategory` to the API-client-facing type.
pub fn frontend_failure_category_to_api_clients(db_value: &FrontendFailureCategory) -> FrontendFailureCategoryForApiClients {
  match db_value {
    FrontendFailureCategory::FaceNotDetected => FrontendFailureCategoryForApiClients::FaceNotDetected,
    FrontendFailureCategory::KeepAliveElapsed => FrontendFailureCategoryForApiClients::KeepAliveElapsed,
    FrontendFailureCategory::NotYetImplemented => FrontendFailureCategoryForApiClients::NotYetImplemented,
    FrontendFailureCategory::RetryableWorkerError => FrontendFailureCategoryForApiClients::RetryableWorkerError,
    FrontendFailureCategory::ModelRulesViolation => FrontendFailureCategoryForApiClients::ModelRulesViolation,
    FrontendFailureCategory::RuleBansUserImage => FrontendFailureCategoryForApiClients::RuleBansUserImage,
    FrontendFailureCategory::RuleBansUserImageWithFaces => FrontendFailureCategoryForApiClients::RuleBansUserImageWithFaces,
    FrontendFailureCategory::RuleBansUserTextPrompt => FrontendFailureCategoryForApiClients::RuleBansUserTextPrompt,
    FrontendFailureCategory::RuleBansUserContent => FrontendFailureCategoryForApiClients::RuleBansUserContent,
    FrontendFailureCategory::RuleBansGeneratedVideo => FrontendFailureCategoryForApiClients::RuleBansGeneratedVideo,
    FrontendFailureCategory::RuleBansGeneratedAudio => FrontendFailureCategoryForApiClients::RuleBansGeneratedAudio,
    FrontendFailureCategory::RuleBansGeneratedContent => FrontendFailureCategoryForApiClients::RuleBansGeneratedContent,
    FrontendFailureCategory::GenerationFailed => FrontendFailureCategoryForApiClients::GenerationFailed,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn all_db_variants_convert() {
    use strum::IntoEnumIterator;
    for variant in FrontendFailureCategory::iter() {
      let _ = frontend_failure_category_to_api_clients(&variant);
    }
  }
}
