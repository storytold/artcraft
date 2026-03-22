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
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in TaskFailureType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: TaskFailureType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
