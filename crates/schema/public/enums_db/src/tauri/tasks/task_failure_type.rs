use crate::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums_shared::error::enums_error::EnumsError;
use strum::EnumCount;
use strum::EnumIter;

/// Failure type for tasks in the Tauri desktop app.
///
/// Mirrors the relevant variants from `FrontendFailureCategory` so the desktop
/// client can display localized failure information without depending / breaking on the
/// server-side enum directly.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum TaskFailureType {
  /// Catch-all for unknown failures.
  Unknown,

  RuleBansUserImage,
  RuleBansUserImageWithFaces,
  RuleBansUserTextPrompt,
  RuleBansUserContent,

  RuleBansGeneratedVideo,
  RuleBansGeneratedAudio,
  RuleBansGeneratedContent,

  /// No reason given for generation failure, but this matches what we were told.
  GenerationFailed,
}

impl_enum_display_and_debug_using_to_str!(TaskFailureType);

impl TaskFailureType {

  /// Convert the web API's `FrontendFailureCategory` to a Tauri-facing type, if there is a matching variant.
  /// If there isn't a matching variant, return `Unknown`.
  pub fn from_frontend_failure_category(category: FrontendFailureCategory) -> Self {
    match category {
      FrontendFailureCategory::ModelRulesViolation => Self::RuleBansUserContent, // NB: This is a legacy enum value.
      FrontendFailureCategory::RuleBansUserImage => Self::RuleBansUserImage,
      FrontendFailureCategory::RuleBansUserImageWithFaces => Self::RuleBansUserImageWithFaces,
      FrontendFailureCategory::RuleBansUserTextPrompt => Self::RuleBansUserTextPrompt,
      FrontendFailureCategory::RuleBansUserContent => Self::RuleBansUserContent,
      FrontendFailureCategory::RuleBansGeneratedVideo => Self::RuleBansGeneratedVideo,
      FrontendFailureCategory::RuleBansGeneratedAudio => Self::RuleBansGeneratedAudio,
      FrontendFailureCategory::RuleBansGeneratedContent => Self::RuleBansGeneratedContent,
      FrontendFailureCategory::GenerationFailed => Self::GenerationFailed,
      _ => Self::Unknown,
    }
  }

  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::Unknown => "unknown",
      Self::RuleBansUserImage => "rule_bans_user_image",
      Self::RuleBansUserImageWithFaces => "rule_bans_user_image_with_faces",
      Self::RuleBansUserTextPrompt => "rule_bans_user_text_prompt",
      Self::RuleBansUserContent => "rule_bans_user_content",
      Self::RuleBansGeneratedVideo => "rule_bans_generated_video",
      Self::RuleBansGeneratedAudio => "rule_bans_generated_audio",
      Self::RuleBansGeneratedContent => "rule_bans_generated_content",
      Self::GenerationFailed => "generation_failed",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumsError> {
    match value {
      "unknown" => Ok(Self::Unknown),
      "rule_bans_user_image" => Ok(Self::RuleBansUserImage),
      "rule_bans_user_image_with_faces" => Ok(Self::RuleBansUserImageWithFaces),
      "rule_bans_user_text_prompt" => Ok(Self::RuleBansUserTextPrompt),
      "rule_bans_user_content" => Ok(Self::RuleBansUserContent),
      "rule_bans_generated_video" => Ok(Self::RuleBansGeneratedVideo),
      "rule_bans_generated_audio" => Ok(Self::RuleBansGeneratedAudio),
      "rule_bans_generated_content" => Ok(Self::RuleBansGeneratedContent),
      "generation_failed" => Ok(Self::GenerationFailed),
      _ => Err(EnumsError::CouldNotConvertFromString(value.to_string())),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::TaskFailureType;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use enums_shared::error::enums_error::EnumsError;

    #[test]
    fn test_serialization() {
      assert_serialization(TaskFailureType::Unknown, "unknown");
      assert_serialization(TaskFailureType::RuleBansUserImage, "rule_bans_user_image");
      assert_serialization(TaskFailureType::RuleBansUserImageWithFaces, "rule_bans_user_image_with_faces");
      assert_serialization(TaskFailureType::RuleBansUserTextPrompt, "rule_bans_user_text_prompt");
      assert_serialization(TaskFailureType::RuleBansUserContent, "rule_bans_user_content");
      assert_serialization(TaskFailureType::RuleBansGeneratedVideo, "rule_bans_generated_video");
      assert_serialization(TaskFailureType::RuleBansGeneratedAudio, "rule_bans_generated_audio");
      assert_serialization(TaskFailureType::RuleBansGeneratedContent, "rule_bans_generated_content");
      assert_serialization(TaskFailureType::GenerationFailed, "generation_failed");
    }

    #[test]
    fn to_str() {
      assert_eq!(TaskFailureType::Unknown.to_str(), "unknown");
      assert_eq!(TaskFailureType::RuleBansUserImage.to_str(), "rule_bans_user_image");
      assert_eq!(TaskFailureType::RuleBansUserImageWithFaces.to_str(), "rule_bans_user_image_with_faces");
      assert_eq!(TaskFailureType::RuleBansUserTextPrompt.to_str(), "rule_bans_user_text_prompt");
      assert_eq!(TaskFailureType::RuleBansUserContent.to_str(), "rule_bans_user_content");
      assert_eq!(TaskFailureType::RuleBansGeneratedVideo.to_str(), "rule_bans_generated_video");
      assert_eq!(TaskFailureType::RuleBansGeneratedAudio.to_str(), "rule_bans_generated_audio");
      assert_eq!(TaskFailureType::RuleBansGeneratedContent.to_str(), "rule_bans_generated_content");
      assert_eq!(TaskFailureType::GenerationFailed.to_str(), "generation_failed");
    }

    #[test]
    fn from_str() {
      assert_eq!(TaskFailureType::from_str("unknown").unwrap(), TaskFailureType::Unknown);
      assert_eq!(TaskFailureType::from_str("rule_bans_user_image").unwrap(), TaskFailureType::RuleBansUserImage);
      assert_eq!(TaskFailureType::from_str("rule_bans_user_image_with_faces").unwrap(), TaskFailureType::RuleBansUserImageWithFaces);
      assert_eq!(TaskFailureType::from_str("rule_bans_user_text_prompt").unwrap(), TaskFailureType::RuleBansUserTextPrompt);
      assert_eq!(TaskFailureType::from_str("rule_bans_user_content").unwrap(), TaskFailureType::RuleBansUserContent);
      assert_eq!(TaskFailureType::from_str("rule_bans_generated_video").unwrap(), TaskFailureType::RuleBansGeneratedVideo);
      assert_eq!(TaskFailureType::from_str("rule_bans_generated_audio").unwrap(), TaskFailureType::RuleBansGeneratedAudio);
      assert_eq!(TaskFailureType::from_str("rule_bans_generated_content").unwrap(), TaskFailureType::RuleBansGeneratedContent);
      assert_eq!(TaskFailureType::from_str("generation_failed").unwrap(), TaskFailureType::GenerationFailed);
    }

    #[test]
    fn from_str_err() {
      let result = TaskFailureType::from_str("asdf");
      assert!(result.is_err());
      if let Err(EnumsError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumsError::CouldNotConvertFromString");
      }
    }

  }

  mod from_frontend_failure_category {
    use super::*;
    use crate::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;

    #[test]
    fn direct_mappings() {
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::RuleBansUserImage), TaskFailureType::RuleBansUserImage);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::RuleBansUserImageWithFaces), TaskFailureType::RuleBansUserImageWithFaces);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::RuleBansUserTextPrompt), TaskFailureType::RuleBansUserTextPrompt);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::RuleBansUserContent), TaskFailureType::RuleBansUserContent);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::RuleBansGeneratedVideo), TaskFailureType::RuleBansGeneratedVideo);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::RuleBansGeneratedAudio), TaskFailureType::RuleBansGeneratedAudio);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::RuleBansGeneratedContent), TaskFailureType::RuleBansGeneratedContent);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::GenerationFailed), TaskFailureType::GenerationFailed);
    }

    #[test]
    fn legacy_model_rules_violation_maps_to_rule_bans_user_content() {
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::ModelRulesViolation), TaskFailureType::RuleBansUserContent);
    }

    #[test]
    fn unmapped_variants_become_unknown() {
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::FaceNotDetected), TaskFailureType::Unknown);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::KeepAliveElapsed), TaskFailureType::Unknown);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::NotYetImplemented), TaskFailureType::Unknown);
      assert_eq!(TaskFailureType::from_frontend_failure_category(FrontendFailureCategory::RetryableWorkerError), TaskFailureType::Unknown);
    }

    #[test]
    fn all_frontend_variants_are_handled() {
      use strum::IntoEnumIterator;
      for variant in FrontendFailureCategory::iter() {
        // Should not panic — every variant produces a valid TaskFailureType.
        let _ = TaskFailureType::from_frontend_failure_category(variant);
      }
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in TaskFailureType::iter() {
        assert_eq!(variant, TaskFailureType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TaskFailureType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TaskFailureType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in TaskFailureType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
