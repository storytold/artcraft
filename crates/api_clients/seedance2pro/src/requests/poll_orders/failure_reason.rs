use super::failure_type::FailureType;

/// A structured failure reason parsed from the raw Seedance2 Pro API response.
#[derive(Debug, Clone)]
pub struct FailureReason {
  /// The original reason string from the API.
  pub reason: String,
  /// The categorized failure type.
  pub failure_type: FailureType,
}

impl FailureReason {
  /// Parse a raw failure reason string into a structured `FailureReason`.
  ///
  /// First checks for exact string matches against known reasons,
  /// then falls back to case-insensitive substring matching.
  pub fn from_reason(reason: &str) -> Self {
    let failure_type = classify_reason(reason);
    FailureReason {
      reason: reason.to_string(),
      failure_type,
    }
  }
}

fn classify_reason(reason: &str) -> FailureType {
  // --- Exact matches first ---
  match reason {
    "Your uploaded image violates platform rules. Please modify and try again." =>
      return FailureType::RuleBansUserImage,
    "Face detected in uploaded media. Please adjust your media and try again." =>
      return FailureType::RuleBansUserImageWithFaces,
    "Your input text violates platform rules. Please modify and try again." =>
      return FailureType::RuleBansUserTextPrompt,
    "Content violates platform rules. Please modify and try again." =>
      return FailureType::RuleBansUserContent,
    "The generated video did not pass review. Credits will not be deducted." =>
      return FailureType::RuleBansGeneratedVideo,
    "The generated audio violates platform rules. Please adjust your prompt or images and try again." =>
      return FailureType::RuleBansGeneratedAudio,
    "The generated content violates platform rules. Please adjust your prompt or images and try again." =>
      return FailureType::RuleBansGeneratedContent,
    "Video generation failed. Please try again." =>
      return FailureType::GenerationFailed,
    "Generation timed out. Please try again." =>
      return FailureType::GenerationFailed,
    "Server error. Please try again later." =>
      return FailureType::GenerationFailed,
    "Your content could not be processed. Please try different images or adjust your prompt." =>
      return FailureType::GenerationFailed,
    _ => {}
  }

  // --- Substring matches (case-insensitive) ---
  let lower = reason.to_lowercase();

  if lower.contains("face detected") || lower.contains("ensure no faces") {
    return FailureType::RuleBansUserImageWithFaces;
  }
  if lower.contains("uploaded image violates") {
    return FailureType::RuleBansUserImage;
  }
  if lower.contains("input text violates") {
    return FailureType::RuleBansUserTextPrompt;
  }
  if lower.contains("generated video") && lower.contains("not pass review") {
    return FailureType::RuleBansGeneratedVideo;
  }
  if lower.contains("generated audio") && lower.contains("violates") {
    return FailureType::RuleBansGeneratedAudio;
  }
  if lower.contains("generated content") && lower.contains("violates") {
    return FailureType::RuleBansGeneratedContent;
  }
  if lower.contains("content violates") || lower.contains("platform rules") {
    return FailureType::RuleBansUserContent;
  }
  if lower.contains("video generation failed") || lower.contains("timed out") || lower.contains("server error") {
    return FailureType::GenerationFailed;
  }

  FailureType::OtherUnknownReason
}
