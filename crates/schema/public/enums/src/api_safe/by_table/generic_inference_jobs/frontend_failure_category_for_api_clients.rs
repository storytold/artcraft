use crate::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use utoipa::ToSchema;

/// A forward-compatible version of `FrontendFailureCategory` for API clients.
///
/// Contains all known variants plus an `Unknown(String)` catch-all so that
/// newer server-side values never cause deserialization failures on the client.
#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FrontendFailureCategoryForApiClients {
  FaceNotDetected,
  KeepAliveElapsed,
  NotYetImplemented,
  RetryableWorkerError,
  ModelRulesViolation,
  RuleBansUserImage,
  RuleBansUserImageWithFaces,
  RuleBansUserTextPrompt,
  RuleBansUserContent,
  RuleBansGeneratedVideo,
  RuleBansGeneratedAudio,
  RuleBansGeneratedContent,
  GenerationFailed,

  /// Catch-all for values the client doesn't yet know about.
  /// The contained string is the raw serialized value from the server.
  #[serde(untagged)]
  Unknown(String),
}

impl FrontendFailureCategoryForApiClients {
  pub fn from_db_enum(value: FrontendFailureCategory) -> Self {
    match value {
      FrontendFailureCategory::FaceNotDetected => Self::FaceNotDetected,
      FrontendFailureCategory::KeepAliveElapsed => Self::KeepAliveElapsed,
      FrontendFailureCategory::NotYetImplemented => Self::NotYetImplemented,
      FrontendFailureCategory::RetryableWorkerError => Self::RetryableWorkerError,
      FrontendFailureCategory::ModelRulesViolation => Self::ModelRulesViolation,
      FrontendFailureCategory::RuleBansUserImage => Self::RuleBansUserImage,
      FrontendFailureCategory::RuleBansUserImageWithFaces => Self::RuleBansUserImageWithFaces,
      FrontendFailureCategory::RuleBansUserTextPrompt => Self::RuleBansUserTextPrompt,
      FrontendFailureCategory::RuleBansUserContent => Self::RuleBansUserContent,
      FrontendFailureCategory::RuleBansGeneratedVideo => Self::RuleBansGeneratedVideo,
      FrontendFailureCategory::RuleBansGeneratedAudio => Self::RuleBansGeneratedAudio,
      FrontendFailureCategory::RuleBansGeneratedContent => Self::RuleBansGeneratedContent,
      FrontendFailureCategory::GenerationFailed => Self::GenerationFailed,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_deserialize_known_variants() {
    let cases = vec![
      ("\"face_not_detected\"", FrontendFailureCategoryForApiClients::FaceNotDetected),
      ("\"keep_alive_elapsed\"", FrontendFailureCategoryForApiClients::KeepAliveElapsed),
      ("\"not_yet_implemented\"", FrontendFailureCategoryForApiClients::NotYetImplemented),
      ("\"retryable_worker_error\"", FrontendFailureCategoryForApiClients::RetryableWorkerError),
      ("\"model_rules_violation\"", FrontendFailureCategoryForApiClients::ModelRulesViolation),
      ("\"rule_bans_user_image\"", FrontendFailureCategoryForApiClients::RuleBansUserImage),
      ("\"rule_bans_user_image_with_faces\"", FrontendFailureCategoryForApiClients::RuleBansUserImageWithFaces),
      ("\"rule_bans_user_text_prompt\"", FrontendFailureCategoryForApiClients::RuleBansUserTextPrompt),
      ("\"rule_bans_user_content\"", FrontendFailureCategoryForApiClients::RuleBansUserContent),
      ("\"rule_bans_generated_video\"", FrontendFailureCategoryForApiClients::RuleBansGeneratedVideo),
      ("\"rule_bans_generated_audio\"", FrontendFailureCategoryForApiClients::RuleBansGeneratedAudio),
      ("\"rule_bans_generated_content\"", FrontendFailureCategoryForApiClients::RuleBansGeneratedContent),
      ("\"generation_failed\"", FrontendFailureCategoryForApiClients::GenerationFailed),
    ];

    for (json, expected) in cases {
      let parsed: FrontendFailureCategoryForApiClients = serde_json::from_str(json)
          .unwrap_or_else(|e| panic!("failed to parse {}: {}", json, e));
      assert_eq!(parsed, expected, "mismatch for {}", json);
    }
  }

  #[test]
  fn test_deserialize_unknown_variant() {
    let json = "\"some_future_category\"";
    let parsed: FrontendFailureCategoryForApiClients = serde_json::from_str(json).unwrap();
    assert_eq!(parsed, FrontendFailureCategoryForApiClients::Unknown("some_future_category".to_string()));
  }

  #[test]
  fn test_deserialize_another_unknown_variant() {
    let json = "\"totally_new_thing\"";
    let parsed: FrontendFailureCategoryForApiClients = serde_json::from_str(json).unwrap();
    assert_eq!(parsed, FrontendFailureCategoryForApiClients::Unknown("totally_new_thing".to_string()));
  }

  #[test]
  fn test_serialize_known_variants() {
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForApiClients::FaceNotDetected).unwrap(), "\"face_not_detected\"");
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForApiClients::ModelRulesViolation).unwrap(), "\"model_rules_violation\"");
    assert_eq!(serde_json::to_string(&FrontendFailureCategoryForApiClients::GenerationFailed).unwrap(), "\"generation_failed\"");
  }

  #[test]
  fn test_serialize_unknown_variant() {
    let unknown = FrontendFailureCategoryForApiClients::Unknown("some_future_category".to_string());
    assert_eq!(serde_json::to_string(&unknown).unwrap(), "\"some_future_category\"");
  }

  #[test]
  fn test_from_db_enum() {
    assert_eq!(
      FrontendFailureCategoryForApiClients::from_db_enum(FrontendFailureCategory::FaceNotDetected),
      FrontendFailureCategoryForApiClients::FaceNotDetected
    );
    assert_eq!(
      FrontendFailureCategoryForApiClients::from_db_enum(FrontendFailureCategory::GenerationFailed),
      FrontendFailureCategoryForApiClients::GenerationFailed
    );
    assert_eq!(
      FrontendFailureCategoryForApiClients::from_db_enum(FrontendFailureCategory::RuleBansGeneratedContent),
      FrontendFailureCategoryForApiClients::RuleBansGeneratedContent
    );
  }
}
