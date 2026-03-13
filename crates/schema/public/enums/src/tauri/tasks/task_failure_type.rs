use std::collections::BTreeSet;

use crate::api_safe::by_table::generic_inference_jobs::frontend_failure_category_for_api_clients::FrontendFailureCategoryForApiClients;
use crate::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use crate::error::enum_error::EnumError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Failure type for tasks in the Tauri desktop app.
///
/// Mirrors the relevant variants from `FrontendFailureCategory` so the desktop
/// client can display localized failure information without depending / breaking on the
/// server-side enum directly.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
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

  /// Convert the API-client-facing `FrontendFailureCategoryForApiClients` to a Tauri-facing type.
  /// `Unknown(String)` maps to `Unknown` with a debug log.
  pub fn from_frontend_failure_category_for_api(category: &FrontendFailureCategoryForApiClients) -> Self {
    match category {
      FrontendFailureCategoryForApiClients::ModelRulesViolation => Self::RuleBansUserContent,
      FrontendFailureCategoryForApiClients::RuleBansUserImage => Self::RuleBansUserImage,
      FrontendFailureCategoryForApiClients::RuleBansUserImageWithFaces => Self::RuleBansUserImageWithFaces,
      FrontendFailureCategoryForApiClients::RuleBansUserTextPrompt => Self::RuleBansUserTextPrompt,
      FrontendFailureCategoryForApiClients::RuleBansUserContent => Self::RuleBansUserContent,
      FrontendFailureCategoryForApiClients::RuleBansGeneratedVideo => Self::RuleBansGeneratedVideo,
      FrontendFailureCategoryForApiClients::RuleBansGeneratedAudio => Self::RuleBansGeneratedAudio,
      FrontendFailureCategoryForApiClients::RuleBansGeneratedContent => Self::RuleBansGeneratedContent,
      FrontendFailureCategoryForApiClients::GenerationFailed => Self::GenerationFailed,

      // Types ArtCraft doesn't care about
      FrontendFailureCategoryForApiClients::FaceNotDetected => Self::Unknown,
      FrontendFailureCategoryForApiClients::KeepAliveElapsed => Self::Unknown,
      FrontendFailureCategoryForApiClients::NotYetImplemented => Self::Unknown,
      FrontendFailureCategoryForApiClients::RetryableWorkerError => Self::Unknown,

      // Unknown (future-proof) variant
      FrontendFailureCategoryForApiClients::Unknown(ref value) => {
        log::debug!("Unknown FrontendFailureCategoryForApiClients variant: {}", value);
        Self::Unknown
      }
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

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
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
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Unknown,
      Self::RuleBansUserImage,
      Self::RuleBansUserImageWithFaces,
      Self::RuleBansUserTextPrompt,
      Self::RuleBansUserContent,
      Self::RuleBansGeneratedVideo,
      Self::RuleBansGeneratedAudio,
      Self::RuleBansGeneratedContent,
      Self::GenerationFailed,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::tauri::tasks::task_failure_type::TaskFailureType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

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
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = TaskFailureType::all_variants();
      assert_eq!(variants.len(), 9);
      assert_eq!(variants.pop_first(), Some(TaskFailureType::Unknown));
      assert_eq!(variants.pop_first(), Some(TaskFailureType::RuleBansUserImage));
      assert_eq!(variants.pop_first(), Some(TaskFailureType::RuleBansUserImageWithFaces));
      assert_eq!(variants.pop_first(), Some(TaskFailureType::RuleBansUserTextPrompt));
      assert_eq!(variants.pop_first(), Some(TaskFailureType::RuleBansUserContent));
      assert_eq!(variants.pop_first(), Some(TaskFailureType::RuleBansGeneratedVideo));
      assert_eq!(variants.pop_first(), Some(TaskFailureType::RuleBansGeneratedAudio));
      assert_eq!(variants.pop_first(), Some(TaskFailureType::RuleBansGeneratedContent));
      assert_eq!(variants.pop_first(), Some(TaskFailureType::GenerationFailed));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(TaskFailureType::all_variants().len(), TaskFailureType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in TaskFailureType::all_variants() {
        assert_eq!(variant, TaskFailureType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TaskFailureType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TaskFailureType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
