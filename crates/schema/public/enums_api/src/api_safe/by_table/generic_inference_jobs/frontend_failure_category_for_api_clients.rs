use strum::EnumIter;
use utoipa::ToSchema;

/// A forward-compatible version of `FrontendFailureCategory` for API clients.
///
/// Contains all known variants plus an `Unknown(String)` catch-all so that
/// newer server-side values never cause deserialization failures on the client.
#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize, ToSchema, EnumIter)]
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

#[cfg(test)]
mod tests {
  use super::FrontendFailureCategoryForApiClients;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(FrontendFailureCategoryForApiClients::FaceNotDetected, "face_not_detected");
      assert_serialization(FrontendFailureCategoryForApiClients::KeepAliveElapsed, "keep_alive_elapsed");
      assert_serialization(FrontendFailureCategoryForApiClients::NotYetImplemented, "not_yet_implemented");
      assert_serialization(FrontendFailureCategoryForApiClients::RetryableWorkerError, "retryable_worker_error");
      assert_serialization(FrontendFailureCategoryForApiClients::ModelRulesViolation, "model_rules_violation");
      assert_serialization(FrontendFailureCategoryForApiClients::RuleBansUserImage, "rule_bans_user_image");
      assert_serialization(FrontendFailureCategoryForApiClients::RuleBansUserImageWithFaces, "rule_bans_user_image_with_faces");
      assert_serialization(FrontendFailureCategoryForApiClients::RuleBansUserTextPrompt, "rule_bans_user_text_prompt");
      assert_serialization(FrontendFailureCategoryForApiClients::RuleBansUserContent, "rule_bans_user_content");
      assert_serialization(FrontendFailureCategoryForApiClients::RuleBansGeneratedVideo, "rule_bans_generated_video");
      assert_serialization(FrontendFailureCategoryForApiClients::RuleBansGeneratedAudio, "rule_bans_generated_audio");
      assert_serialization(FrontendFailureCategoryForApiClients::RuleBansGeneratedContent, "rule_bans_generated_content");
      assert_serialization(FrontendFailureCategoryForApiClients::GenerationFailed, "generation_failed");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("face_not_detected", FrontendFailureCategoryForApiClients::FaceNotDetected);
      assert_deserialization("keep_alive_elapsed", FrontendFailureCategoryForApiClients::KeepAliveElapsed);
      assert_deserialization("not_yet_implemented", FrontendFailureCategoryForApiClients::NotYetImplemented);
      assert_deserialization("retryable_worker_error", FrontendFailureCategoryForApiClients::RetryableWorkerError);
      assert_deserialization("model_rules_violation", FrontendFailureCategoryForApiClients::ModelRulesViolation);
      assert_deserialization("rule_bans_user_image", FrontendFailureCategoryForApiClients::RuleBansUserImage);
      assert_deserialization("rule_bans_user_image_with_faces", FrontendFailureCategoryForApiClients::RuleBansUserImageWithFaces);
      assert_deserialization("rule_bans_user_text_prompt", FrontendFailureCategoryForApiClients::RuleBansUserTextPrompt);
      assert_deserialization("rule_bans_user_content", FrontendFailureCategoryForApiClients::RuleBansUserContent);
      assert_deserialization("rule_bans_generated_video", FrontendFailureCategoryForApiClients::RuleBansGeneratedVideo);
      assert_deserialization("rule_bans_generated_audio", FrontendFailureCategoryForApiClients::RuleBansGeneratedAudio);
      assert_deserialization("rule_bans_generated_content", FrontendFailureCategoryForApiClients::RuleBansGeneratedContent);
      assert_deserialization("generation_failed", FrontendFailureCategoryForApiClients::GenerationFailed);
    }

    #[test]
    fn unknown_variant_deserializes() {
      let json = "\"some_future_category\"";
      let value: FrontendFailureCategoryForApiClients = serde_json::from_str(json).unwrap();
      assert_eq!(value, FrontendFailureCategoryForApiClients::Unknown("some_future_category".to_string()));
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      let known_variants = vec![
        FrontendFailureCategoryForApiClients::FaceNotDetected,
        FrontendFailureCategoryForApiClients::KeepAliveElapsed,
        FrontendFailureCategoryForApiClients::NotYetImplemented,
        FrontendFailureCategoryForApiClients::RetryableWorkerError,
        FrontendFailureCategoryForApiClients::ModelRulesViolation,
        FrontendFailureCategoryForApiClients::RuleBansUserImage,
        FrontendFailureCategoryForApiClients::RuleBansUserImageWithFaces,
        FrontendFailureCategoryForApiClients::RuleBansUserTextPrompt,
        FrontendFailureCategoryForApiClients::RuleBansUserContent,
        FrontendFailureCategoryForApiClients::RuleBansGeneratedVideo,
        FrontendFailureCategoryForApiClients::RuleBansGeneratedAudio,
        FrontendFailureCategoryForApiClients::RuleBansGeneratedContent,
        FrontendFailureCategoryForApiClients::GenerationFailed,
      ];
      assert_eq!(known_variants.len(), 13);
      for variant in known_variants {
        let json = serde_json::to_string(&variant).unwrap();
        let back: FrontendFailureCategoryForApiClients = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
