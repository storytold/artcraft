use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;

pub struct SyntheticFailure {
  pub frontend_failure_category: FrontendFailureCategory,
  pub frontend_failure_message: Option<String>,
}

/// If the prompt contains the secret trigger phrase, parse a
/// `FrontendFailureCategory` from the remaining words (falling back to
/// `GenerationFailed`) and return a `SyntheticFailure`.
///
/// Returns `None` when the trigger phrase is absent.
pub fn test_synthetic_failure_reason(prompt: &str) -> Option<SyntheticFailure> {
  let lower = prompt.to_ascii_lowercase();
  if !lower.contains("simulate_artcraft_failure") && !lower.contains("test_artcraft_failure") {
    return None;
  }

  let maybe_category = prompt
      .split_whitespace()
      .find_map(|word| FrontendFailureCategory::from_str(word).ok());

  let category = maybe_category.unwrap_or(FrontendFailureCategory::GenerationFailed);

  Some(SyntheticFailure {
    frontend_failure_category: category,
    frontend_failure_message: Some("This was a simulated failure".to_string()),
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn no_trigger_returns_none() {
    assert!(test_synthetic_failure_reason("a normal prompt").is_none());
  }

  #[test]
  fn trigger_simulate_with_no_category_defaults_to_generation_failed() {
    let result = test_synthetic_failure_reason("simulate_artcraft_failure").unwrap();
    assert_eq!(result.frontend_failure_category, FrontendFailureCategory::GenerationFailed);
    assert_eq!(result.frontend_failure_message.as_deref(), Some("This was a simulated failure"));
  }

  #[test]
  fn trigger_test_with_no_category_defaults_to_generation_failed() {
    let result = test_synthetic_failure_reason("test_artcraft_failure").unwrap();
    assert_eq!(result.frontend_failure_category, FrontendFailureCategory::GenerationFailed);
    assert_eq!(result.frontend_failure_message.as_deref(), Some("This was a simulated failure"));
  }

  #[test]
  fn trigger_with_known_category() {
    let result = test_synthetic_failure_reason("simulate_artcraft_failure face_not_detected").unwrap();
    assert_eq!(result.frontend_failure_category, FrontendFailureCategory::FaceNotDetected);
  }

  #[test]
  fn trigger_with_category_before_keyword() {
    let result = test_synthetic_failure_reason("rule_bans_user_image simulate_artcraft_failure").unwrap();
    assert_eq!(result.frontend_failure_category, FrontendFailureCategory::RuleBansUserImage);
  }

  #[test]
  fn trigger_with_model_rules_violation() {
    let result = test_synthetic_failure_reason("test_artcraft_failure model_rules_violation please").unwrap();
    assert_eq!(result.frontend_failure_category, FrontendFailureCategory::ModelRulesViolation);
  }

  #[test]
  fn trigger_is_case_insensitive() {
    let result = test_synthetic_failure_reason("SIMULATE_ARTCRAFT_FAILURE").unwrap();
    assert_eq!(result.frontend_failure_category, FrontendFailureCategory::GenerationFailed);
  }

  #[test]
  fn trigger_embedded_in_text() {
    let result = test_synthetic_failure_reason("hello world simulate_artcraft_failure keep_alive_elapsed goodbye").unwrap();
    assert_eq!(result.frontend_failure_category, FrontendFailureCategory::KeepAliveElapsed);
  }
}
