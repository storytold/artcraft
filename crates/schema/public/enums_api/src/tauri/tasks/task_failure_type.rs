use strum::EnumIter;
use utoipa::ToSchema;

/// Failure type for tasks in the Tauri desktop app.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
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

#[cfg(test)]
mod tests {
  use super::TaskFailureType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
    fn test_deserialization() {
      assert_deserialization("unknown", TaskFailureType::Unknown);
      assert_deserialization("rule_bans_user_image", TaskFailureType::RuleBansUserImage);
      assert_deserialization("rule_bans_user_image_with_faces", TaskFailureType::RuleBansUserImageWithFaces);
      assert_deserialization("rule_bans_user_text_prompt", TaskFailureType::RuleBansUserTextPrompt);
      assert_deserialization("rule_bans_user_content", TaskFailureType::RuleBansUserContent);
      assert_deserialization("rule_bans_generated_video", TaskFailureType::RuleBansGeneratedVideo);
      assert_deserialization("rule_bans_generated_audio", TaskFailureType::RuleBansGeneratedAudio);
      assert_deserialization("rule_bans_generated_content", TaskFailureType::RuleBansGeneratedContent);
      assert_deserialization("generation_failed", TaskFailureType::GenerationFailed);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(TaskFailureType::iter().count(), 9);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TaskFailureType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TaskFailureType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
