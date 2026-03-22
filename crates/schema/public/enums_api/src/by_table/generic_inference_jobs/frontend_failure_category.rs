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
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

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

#[cfg(test)]
mod tests {
  use super::FrontendFailureCategory;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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
    fn test_deserialization() {
      assert_deserialization("face_not_detected", FrontendFailureCategory::FaceNotDetected);
      assert_deserialization("keep_alive_elapsed", FrontendFailureCategory::KeepAliveElapsed);
      assert_deserialization("not_yet_implemented", FrontendFailureCategory::NotYetImplemented);
      assert_deserialization("retryable_worker_error", FrontendFailureCategory::RetryableWorkerError);
      assert_deserialization("model_rules_violation", FrontendFailureCategory::ModelRulesViolation);
      assert_deserialization("rule_bans_user_image", FrontendFailureCategory::RuleBansUserImage);
      assert_deserialization("rule_bans_user_image_with_faces", FrontendFailureCategory::RuleBansUserImageWithFaces);
      assert_deserialization("rule_bans_user_text_prompt", FrontendFailureCategory::RuleBansUserTextPrompt);
      assert_deserialization("rule_bans_user_content", FrontendFailureCategory::RuleBansUserContent);
      assert_deserialization("rule_bans_generated_video", FrontendFailureCategory::RuleBansGeneratedVideo);
      assert_deserialization("rule_bans_generated_audio", FrontendFailureCategory::RuleBansGeneratedAudio);
      assert_deserialization("rule_bans_generated_content", FrontendFailureCategory::RuleBansGeneratedContent);
      assert_deserialization("generation_failed", FrontendFailureCategory::GenerationFailed);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(FrontendFailureCategory::iter().count(), 13);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in FrontendFailureCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: FrontendFailureCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
