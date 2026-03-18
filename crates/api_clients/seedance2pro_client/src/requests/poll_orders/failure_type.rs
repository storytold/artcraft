
/// Categorized failure type for a Seedance2 Pro order.
#[derive(Debug, Clone, PartialEq)]
pub enum FailureType {
  /// User's uploaded image was rejected by platform content rules.
  RuleBansUserImage,
  /// User's uploaded image was rejected because it contains faces.
  RuleBansUserImageWithFaces,
  /// User's text prompt was rejected by platform content rules.
  RuleBansUserTextPrompt,
  /// User's content (image or text) was rejected by platform content rules (generic).
  RuleBansUserContent,
  /// The generated video was rejected by platform content review.
  RuleBansGeneratedVideo,
  /// The generated audio was rejected by platform content rules.
  RuleBansGeneratedAudio,
  /// The generated content (video/audio/other) was rejected by platform content rules (generic).
  RuleBansGeneratedContent,
  /// Video generation failed (timeout, server error, processing error, etc.)
  GenerationFailed,
  /// An unrecognized or absent failure reason.
  OtherUnknownReason,
}

impl FailureType {
  pub fn classify_text(reason: &str) -> Self {
    // --- Exact matches first ---
    match reason {
      "Your uploaded image violates platform rules. Please modify and try again." =>
        return Self::RuleBansUserImage,
      "Face detected in uploaded media. Please adjust your media and try again." =>
        return Self::RuleBansUserImageWithFaces,
      "Your input text violates platform rules. Please modify and try again." =>
        return Self::RuleBansUserTextPrompt,
      "Content violates platform rules. Please modify and try again." =>
        return Self::RuleBansUserContent,
      "The generated video did not pass review. Credits will not be deducted." =>
        return Self::RuleBansGeneratedVideo,
      "The generated audio violates platform rules. Please adjust your prompt or images and try again." =>
        return Self::RuleBansGeneratedAudio,
      "The generated content violates platform rules. Please adjust your prompt or images and try again." =>
        return Self::RuleBansGeneratedContent,
      "Video generation failed. Please try again." =>
        return Self::GenerationFailed,
      "Generation timed out. Please try again." =>
        return Self::GenerationFailed,
      "Server error. Please try again later." =>
        return Self::GenerationFailed,
      "Your content could not be processed. Please try different images or adjust your prompt." =>
        return Self::GenerationFailed,
      _ => {}
    }

    // --- Substring matches (case-insensitive) ---
    let lower = reason.to_lowercase();

    if lower.contains("face detected") || lower.contains("ensure no faces") {
      return Self::RuleBansUserImageWithFaces;
    }
    if lower.contains("uploaded image violates") {
      return Self::RuleBansUserImage;
    }
    if lower.contains("input text violates") {
      return Self::RuleBansUserTextPrompt;
    }
    if lower.contains("generated video") && lower.contains("not pass review") {
      return Self::RuleBansGeneratedVideo;
    }
    if lower.contains("generated audio") && lower.contains("violates") {
      return Self::RuleBansGeneratedAudio;
    }
    if lower.contains("generated content") && lower.contains("violates") {
      return Self::RuleBansGeneratedContent;
    }
    if lower.contains("content violates") || lower.contains("platform rules") {
      return Self::RuleBansUserContent;
    }
    if lower.contains("video generation failed") || lower.contains("timed out") || lower.contains("server error") {
      return Self::GenerationFailed;
    }

    Self::OtherUnknownReason
  }
}
