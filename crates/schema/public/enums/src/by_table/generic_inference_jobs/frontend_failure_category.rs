use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `frontend_failure_category`.
///
/// When jobs fail (permanently or transiently), we need to inform the frontend of the reason,
/// because perhaps there's something the user can do to change their input.
///
/// The previous "VARCHAR(32) failure_reason" column was a text-based message that could not be
/// localized or made user friendly. This `frontend_failure_category` exists to provide well-defined
/// failure categories to the frontend that can easily be localized and indicated consistently in
/// the UI.
///
/// Another benefit is that we'll surface all of the various types of failure and perhaps eventually
/// come to handle some in a cross-cutting way.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
pub enum FrontendFailureCategory {
  /// When a face is not detected in the image used for animation.
  /// For SadTalker (and possibly Wav2Lip)
  #[serde(rename = "face_not_detected")]
  FaceNotDetected,

  /// The user stepped away from their device and expected the workload to finish.
  /// Some workloads require that the user keep their browser open.
  #[serde(rename = "keep_alive_elapsed")]
  KeepAliveElapsed,

  /// This is mostly for developers -- a feature isn't complete somewhere in the code.
  /// Big oops if errors of this class make it to production.
  #[serde(rename = "not_yet_implemented")]
  NotYetImplemented,

  /// Tell the user that some kind of transient error happened. They don't need to know
  /// exactly what happened. We'll retry their workload in any case.
  #[serde(rename = "retryable_worker_error")]
  RetryableWorkerError,

  /// Model content rules were violated
  /// Eg. Seedance 2 will report: "your input text violates platform rules. please modify and try again"
  #[serde(rename = "model_rules_violation")]
  ModelRulesViolation,

  /// Model content violation
  /// e.g. "Your uploaded image violates platform rules. Please modify and try again." (seedance2pro)
  /// Model content rules prohibit the uploaded image.
  #[serde(rename = "rule_bans_user_image")]
  RuleBansUserImage,

  /// Model content violation
  /// Model content rules prohibit user uploaded images containing faces (Seedance 2.0)
  /// e.g. "The generated video did not pass review. Credits will not be deducted." (seedance2pro)
  #[serde(rename = "rule_bans_user_image_with_faces")]
  RuleBansUserImageWithFaces,

  /// Model content violation
  /// Model content rules prohibit the user's given text prompt (this fails early).
  /// e.g. "The generated video did not pass review. Credits will not be deducted." (seedance2pro)
  #[serde(rename = "rule_bans_user_text_prompt")]
  RuleBansUserTextPrompt,

  /// Model content violation
  /// Model content rules prohibit user content. (I think this check happens early.)
  /// e.g. "Content violates platform rules. Please modify and try again." (seedance2pro)
  #[serde(rename = "rule_bans_user_content")]
  RuleBansUserContent,

  /// Model content violation
  /// The video didn't pass checks after it finished generation (this fails at the very end of the generation).
  /// e.g. "The generated video did not pass review. Credits will not be deducted." (seedance2pro)
  #[serde(rename = "rule_bans_generated_video")]
  RuleBansGeneratedVideo,

  /// Model content violation
  /// The audio (even in video!) didn't pass checks after it finished generation (this fails at the very end of the generation).
  /// e.g. "The generated audio violates platform rules. Please adjust your prompt or images and try again." (seedance2pro)
  #[serde(rename = "rule_bans_generated_audio")]
  RuleBansGeneratedAudio,

  /// Model content violation
  /// The content didn't pass checks after it finished generation (this fails at the very end of the generation).
  /// e.g. "The generated content violates platform rules. Please adjust your prompt or images and try again." (seedance2pro)
  #[serde(rename = "rule_bans_generated_content")]
  RuleBansGeneratedContent,

  /// Generation failed (no reason)
  /// Unspecified failure reason
  /// Various example failures:
  ///   - "The generated video did not pass review. Credits will not be deducted." (seedance2pro)
  ///   - "Server error. Please try again later." (seedance2pro)
  #[serde(rename = "generation_failed")]
  GenerationFailed,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(FrontendFailureCategory);
impl_mysql_enum_coders!(FrontendFailureCategory);

/// NB: Legacy API for older code.
impl FrontendFailureCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::FaceNotDetected => "face_not_detected",
      Self::KeepAliveElapsed => "keep_alive_elapsed",
      Self::NotYetImplemented => "not_yet_implemented",
      Self::RetryableWorkerError => "retryable_worker_error",
      Self::ModelRulesViolation => "model_rules_violation",
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

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "face_not_detected" => Ok(Self::FaceNotDetected),
      "keep_alive_elapsed" => Ok(Self::KeepAliveElapsed),
      "not_yet_implemented" => Ok(Self::NotYetImplemented),
      "retryable_worker_error" => Ok(Self::RetryableWorkerError),
      "model_rules_violation" => Ok(Self::ModelRulesViolation),
      "rule_bans_user_image" => Ok(Self::RuleBansUserImage),
      "rule_bans_user_image_with_faces" => Ok(Self::RuleBansUserImageWithFaces),
      "rule_bans_user_text_prompt" => Ok(Self::RuleBansUserTextPrompt),
      "rule_bans_user_content" => Ok(Self::RuleBansUserContent),
      "rule_bans_generated_video" => Ok(Self::RuleBansGeneratedVideo),
      "rule_bans_generated_audio" => Ok(Self::RuleBansGeneratedAudio),
      "rule_bans_generated_content" => Ok(Self::RuleBansGeneratedContent),
      "generation_failed" => Ok(Self::GenerationFailed),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::FaceNotDetected,
      Self::KeepAliveElapsed,
      Self::NotYetImplemented,
      Self::RetryableWorkerError,
      Self::ModelRulesViolation,
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
  use crate::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(FrontendFailureCategory::FaceNotDetected, "face_not_detected");
      assert_serialization(FrontendFailureCategory::KeepAliveElapsed, "keep_alive_elapsed");
      assert_serialization(FrontendFailureCategory::NotYetImplemented, "not_yet_implemented");
      assert_serialization(FrontendFailureCategory::RetryableWorkerError, "retryable_worker_error");
      assert_serialization(FrontendFailureCategory::ModelRulesViolation, "model_rules_violation");
      assert_serialization(FrontendFailureCategory::RuleBansUserImage, "rule_bans_user_image");
      assert_serialization(FrontendFailureCategory::RuleBansUserImageWithFaces, "rule_bans_user_image_with_faces");
      assert_serialization(FrontendFailureCategory::RuleBansUserTextPrompt, "rule_bans_user_text_prompt");
      assert_serialization(FrontendFailureCategory::RuleBansUserContent, "rule_bans_user_content");
      assert_serialization(FrontendFailureCategory::RuleBansGeneratedVideo, "rule_bans_generated_video");
      assert_serialization(FrontendFailureCategory::RuleBansGeneratedAudio, "rule_bans_generated_audio");
      assert_serialization(FrontendFailureCategory::RuleBansGeneratedContent, "rule_bans_generated_content");
      assert_serialization(FrontendFailureCategory::GenerationFailed, "generation_failed");
    }

    #[test]
    fn to_str() {
      assert_eq!(FrontendFailureCategory::FaceNotDetected.to_str(), "face_not_detected");
      assert_eq!(FrontendFailureCategory::KeepAliveElapsed.to_str(), "keep_alive_elapsed");
      assert_eq!(FrontendFailureCategory::NotYetImplemented.to_str(), "not_yet_implemented");
      assert_eq!(FrontendFailureCategory::RetryableWorkerError.to_str(), "retryable_worker_error");
      assert_eq!(FrontendFailureCategory::ModelRulesViolation.to_str(), "model_rules_violation");
      assert_eq!(FrontendFailureCategory::RuleBansUserImage.to_str(), "rule_bans_user_image");
      assert_eq!(FrontendFailureCategory::RuleBansUserImageWithFaces.to_str(), "rule_bans_user_image_with_faces");
      assert_eq!(FrontendFailureCategory::RuleBansUserTextPrompt.to_str(), "rule_bans_user_text_prompt");
      assert_eq!(FrontendFailureCategory::RuleBansUserContent.to_str(), "rule_bans_user_content");
      assert_eq!(FrontendFailureCategory::RuleBansGeneratedVideo.to_str(), "rule_bans_generated_video");
      assert_eq!(FrontendFailureCategory::RuleBansGeneratedAudio.to_str(), "rule_bans_generated_audio");
      assert_eq!(FrontendFailureCategory::RuleBansGeneratedContent.to_str(), "rule_bans_generated_content");
      assert_eq!(FrontendFailureCategory::GenerationFailed.to_str(), "generation_failed");
    }

    #[test]
    fn from_str() {
      assert_eq!(FrontendFailureCategory::from_str("face_not_detected").unwrap(), FrontendFailureCategory::FaceNotDetected);
      assert_eq!(FrontendFailureCategory::from_str("keep_alive_elapsed").unwrap(), FrontendFailureCategory::KeepAliveElapsed);
      assert_eq!(FrontendFailureCategory::from_str("not_yet_implemented").unwrap(), FrontendFailureCategory::NotYetImplemented);
      assert_eq!(FrontendFailureCategory::from_str("retryable_worker_error").unwrap(), FrontendFailureCategory::RetryableWorkerError);
      assert_eq!(FrontendFailureCategory::from_str("model_rules_violation").unwrap(), FrontendFailureCategory::ModelRulesViolation);
      assert_eq!(FrontendFailureCategory::from_str("rule_bans_user_image").unwrap(), FrontendFailureCategory::RuleBansUserImage);
      assert_eq!(FrontendFailureCategory::from_str("rule_bans_user_image_with_faces").unwrap(), FrontendFailureCategory::RuleBansUserImageWithFaces);
      assert_eq!(FrontendFailureCategory::from_str("rule_bans_user_text_prompt").unwrap(), FrontendFailureCategory::RuleBansUserTextPrompt);
      assert_eq!(FrontendFailureCategory::from_str("rule_bans_user_content").unwrap(), FrontendFailureCategory::RuleBansUserContent);
      assert_eq!(FrontendFailureCategory::from_str("rule_bans_generated_video").unwrap(), FrontendFailureCategory::RuleBansGeneratedVideo);
      assert_eq!(FrontendFailureCategory::from_str("rule_bans_generated_audio").unwrap(), FrontendFailureCategory::RuleBansGeneratedAudio);
      assert_eq!(FrontendFailureCategory::from_str("rule_bans_generated_content").unwrap(), FrontendFailureCategory::RuleBansGeneratedContent);
      assert_eq!(FrontendFailureCategory::from_str("generation_failed").unwrap(), FrontendFailureCategory::GenerationFailed);
      assert_eq!(FrontendFailureCategory::from_str("invalid_value").is_err(), true);
    }

    #[test]
    fn all_variants() {
      let mut variants = FrontendFailureCategory::all_variants();
      assert_eq!(variants.len(), 13);
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::FaceNotDetected));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::KeepAliveElapsed));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::NotYetImplemented));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RetryableWorkerError));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::ModelRulesViolation));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RuleBansUserImage));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RuleBansUserImageWithFaces));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RuleBansUserTextPrompt));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RuleBansUserContent));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RuleBansGeneratedVideo));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RuleBansGeneratedAudio));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RuleBansGeneratedContent));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::GenerationFailed));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(FrontendFailureCategory::all_variants().len(), FrontendFailureCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in FrontendFailureCategory::all_variants() {
        assert_eq!(variant, FrontendFailureCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, FrontendFailureCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, FrontendFailureCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
